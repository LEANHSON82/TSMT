'use client';

// Ô tìm kiếm + gợi ý (spec mục 3.1): gõ từ 2 ký tự, chờ 300 ms mới gọi API, tối đa 8 gợi ý DN,
// ↑↓ Enter Esc, theo mẫu combobox WAI-ARIA. Enter với MST hợp lệ → vào thẳng trang DN.
// Gợi ý chia nhóm để người dùng biết khớp ở đâu: «Doanh nghiệp» (khớp tên / MST / SĐT — không bao giờ hiện
// số), «Người đại diện» (hiện tên người + DN họ đại diện), «Tỉnh/thành» (từ danh mục có sẵn), và dòng
// «Xem tất cả kết quả». API chưa trả `matched` thì mọi gợi ý vào nhóm «Doanh nghiệp» như trước.
// Nhóm «Ngành nghề» lấy từ danh mục ngành (tải một lần khi người dùng bắt đầu dùng ô tìm). Tổng số dòng gợi ý
// (không kể «Xem tất cả») tối đa 8 — spec 3.1.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getIndustries, suggestCompanies } from '@/lib/api';
import { companyPath, isValidMst, normalizeMst, searchQueryType } from '@/lib/mst';
import { track } from '@/lib/analytics';
import { M } from '@/lib/messages';
import { matchedOtherName, suggestIndustries, suggestProvinces } from '@/lib/search-intent';
import { toSlug } from '@/lib/slug';
import Highlight from './Highlight';
import { IconSearch } from './Icons';
import { startNavigation } from './NavigationProgress';
import { useProvinces } from './ProvincesContext';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 8;
const LAST_Q_KEY = 'tmst:last-query';

// Danh mục ngành cho nhóm gợi ý «Ngành nghề»: tải một lần cho cả trang, lỗi thì bỏ qua nhóm này.
let industriesPromise = null;
const loadIndustries = () => {
  if (!industriesPromise) industriesPromise = getIndustries().catch(() => []);
  return industriesPromise;
};
const industryHref = (ind) => `/nganh/${ind.code}-${ind.slug || toSlug(ind.name)}`;

// Bấm Back/Forward của trình duyệt (popstate) ngay trước khi ô tìm được dựng lại → điền lại từ khoá vừa tìm, khỏi
// gõ lại khi lỡ chọn nhầm một trong nhiều DN trùng tên.
let lastPopState = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    lastPopState = Date.now();
  });
}
function rememberQuery(q) {
  try {
    sessionStorage.setItem(LAST_Q_KEY, JSON.stringify({ q, path: window.location.pathname }));
  } catch {
    /* bỏ qua */
  }
}
function recalledQuery() {
  if (Date.now() - lastPopState > 3000) return '';
  try {
    const saved = JSON.parse(sessionStorage.getItem(LAST_Q_KEY) || 'null');
    return saved && saved.path === window.location.pathname ? String(saved.q || '') : '';
  } catch {
    return '';
  }
}

// size: 'lg' (ô tìm lớn trong trang: trang chủ, 404… — cao 56px, điện thoại 52px) | 'nav' (header — cao 44px).
// Kiểu «hoà dải menu»: xem chú thích ở khung .search-box bên dưới và globals.css.
export default function SearchBox({
  size = 'lg',
  defaultValue = '',
  autoFocusDesktop = false,
  placeholder,
  placeholderWide, // câu dài hơn cho màn hình ≥ 1024px (ô rộng)
  className = '',
  listClassName = '',
  labelledBy,
  addon = null, // phần tử thêm cuối hàng, sau nút «Tìm» (header điện thoại: nút icon «Lọc nâng cao»)
  // false: chữ điền sẵn (defaultValue) không tự lấy gợi ý — chỉ lấy khi người dùng gõ. Trang 404 điền sẵn MST và
  // tự focus: không bung hộp «Không có gợi ý…» trong khi H1 vừa báo đúng điều đó.
  suggestPrefilled = true,
  // Tên của vùng tìm kiếm (landmark role="search") — trang có 2 ô tìm thì mỗi ô một tên.
  searchLabel = M.search.label,
}) {
  const router = useRouter();
  const uid = useId();
  const inputId = `q-${uid}`;
  const listId = `ql-${uid}`;
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const typedRef = useRef(false); // người dùng đã gõ vào ô (khác chữ điền sẵn)
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState([]);
  const [provItems, setProvItems] = useState([]);
  const [indItems, setIndItems] = useState([]);
  // Chữ điền sẵn chỉ lấy gợi ý sau khi người dùng chạm vào ô (tránh mỗi ô tìm của trang tự gọi API khi tải).
  const [armed, setArmed] = useState(false);
  const [listMax, setListMax] = useState(null);
  const [people, setPeople] = useState(null); // người đại diện gộp theo tên (API có thì dùng)
  const [lastQ, setLastQ] = useState(''); // từ khoá ứng với gợi ý đang hiện
  const provinces = useProvinces();
  const [open, setOpen] = useState(false);
  // Dòng chọn bằng phím ↑↓ (Enter mở dòng này). Rê chuột chỉ tô nền (CSS hover), KHÔNG đổi active: chuột
  // nằm yên trên danh sách cũ rồi gõ chữ mới + Enter không được mở nhầm gợi ý cũ.
  const [active, setActive] = useState(-1);
  // 'idle' | 'loading' (đang lấy gợi ý) | 'empty' (không có gợi ý) | 'ready'
  const [status, setStatus] = useState('idle');
  const [focused, setFocused] = useState(false);
  const [wide, setWide] = useState(false);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (!placeholderWide) return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [placeholderWide]);

  // Điện thoại (< 640px): câu spec dài bị cắt giữa chữ («tên doanh nghi…») → câu ngắn cùng ý.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639.98px)');
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Quay lại bằng nút Back: điền lại từ khoá vừa tìm ở trang này (ô không có chữ điền sẵn).
  useEffect(() => {
    if (defaultValue) return;
    const q = recalledQuery();
    if (q) setValue(q);
    // chỉ chạy khi dựng ô
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự focus trên máy tính, KHÔNG tự focus trên điện thoại (bàn phím che màn hình) — spec mục 3.1.
  useEffect(() => {
    if (!autoFocusDesktop) return;
    try {
      if (window.matchMedia('(pointer: fine) and (min-width: 768px)').matches)
        inputRef.current?.focus();
    } catch {
      /* bỏ qua */
    }
  }, [autoFocusDesktop]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < MIN_CHARS || (!typedRef.current && (!suggestPrefilled || !armed))) {
      abortRef.current?.abort();
      setItems([]);
      setProvItems([]);
      setIndItems([]);
      setOpen(false);
      setStatus('idle');
      return undefined;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStatus('loading');
      try {
        const [{ items: res, people: ppl }, industries] = await Promise.all([
          suggestCompanies(q, { signal: ctrl.signal }),
          loadIndustries(),
        ]);
        const provs = suggestProvinces(q, provinces, 2);
        const inds = suggestIndustries(q, industries, 2);
        const any = res.length > 0 || provs.length > 0 || inds.length > 0;
        setItems(res.slice(0, MAX_SUGGESTIONS));
        setPeople(ppl);
        setProvItems(provs);
        setIndItems(inds);
        setLastQ(q);
        setOpen(any && document.activeElement === inputRef.current);
        setActive(-1);
        setStatus(any ? 'ready' : 'empty');
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setItems([]);
          setPeople(null);
          setProvItems([]);
          setIndItems([]);
          setOpen(false);
          setStatus('idle');
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, provinces, suggestPrefilled, armed]);

  // Danh sách phẳng theo thứ tự hiển thị (phím ↑↓ đi qua đúng thứ tự này).
  // Người đại diện: API trả `people` (gộp theo tên, kèm tổng số DN) thì mỗi tên một dòng — một người đứng tên nhiều
  // DN không lặp lại nhiều dòng; không có thì dùng các DN khớp người đại diện như trước. Tổng ≤ 8 dòng (spec 3.1):
  // tỉnh và ngành (mỗi nhóm ≤ 2) giữ chỗ trước, DN + người đại diện lấp phần còn lại.
  const entries = useMemo(() => {
    const extra = [
      ...provItems.map((p) => ({ kind: 'province', p })),
      ...indItems.map((ind) => ({ kind: 'industry', ind })),
    ];
    const room = Math.max(0, MAX_SUGGESTIONS - extra.length);
    const persons = people
      ? people.slice(0, Math.min(4, room)).map((person) => ({ kind: 'person', person }))
      : [];
    const reps = people
      ? []
      : items
          .filter((i) => i.matched === 'representative')
          .slice(0, room)
          .map((item) => ({ kind: 'rep', item }));
    const companies = items
      .filter((i) => i.matched !== 'representative')
      .slice(0, Math.max(0, room - persons.length - reps.length))
      .map((item) => ({ kind: 'company', item }));
    const list = [...companies, ...reps, ...persons, ...extra];
    if (list.length) list.push({ kind: 'all' });
    return list;
  }, [items, people, provItems, indItems]);

  const hrefOf = (e) =>
    e.kind === 'province'
      ? `/tinh/${e.p.slug}`
      : e.kind === 'industry'
        ? industryHref(e.ind)
        : e.kind === 'all'
          ? `/tim-kiem?q=${encodeURIComponent(lastQ)}`
          : e.kind === 'person'
            ? e.person.company_count > 1
              ? `/tim-kiem?q=${encodeURIComponent(e.person.name)}&theo=dai-dien`
              : companyPath(e.person.company)
            : companyPath(e.item);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Gợi ý đang chọn bằng phím mũi tên (rê chuột: onMouseEnter bên dưới): tải trước trang để bấm vào là hiện ngay.
  useEffect(() => {
    const e = entries[active];
    if (e && e.kind !== 'all') router.prefetch(hrefOf(e));
    // hrefOf chỉ phụ thuộc entries / lastQ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, entries, router]);

  function activate(e) {
    setOpen(false);
    rememberQuery(lastQ);
    if (
      e.kind === 'company' ||
      e.kind === 'rep' ||
      (e.kind === 'person' && e.person.company_count === 1)
    )
      track('search', { query_type: searchQueryType(lastQ), result_count: 1 });
    startNavigation();
    router.push(hrefOf(e));
  }

  // Gợi ý đang có là của đúng chữ trong ô (không phải của lần gõ trước, chưa kịp tải gợi ý mới).
  const fresh = lastQ !== '' && lastQ === value.trim();

  function onSubmit(e) {
    e.preventDefault();
    if (open && fresh && active >= 0 && entries[active]) {
      activate(entries[active]);
      return;
    }
    const q = value.trim();
    if (!q) {
      inputRef.current?.focus();
      return;
    }
    setOpen(false);
    rememberQuery(q);
    if (isValidMst(q)) {
      const mst = normalizeMst(q);
      const match = items.find((i) => i.mst === mst);
      track('search', { query_type: 'mst', result_count: match ? 1 : undefined });
      startNavigation();
      router.push(match ? companyPath(match) : `/${mst}`);
      return;
    }
    startNavigation();
    router.push(`/tim-kiem?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      if (!entries.length || !fresh) return;
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % entries.length);
    } else if (e.key === 'ArrowUp') {
      if (!entries.length || !fresh) return;
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a <= 0 ? entries.length - 1 : a - 1));
    } else if (e.key === 'Escape') {
      // input type=search mặc định xoá sạch chữ khi Esc → chặn luôn: Esc chỉ đóng gợi ý.
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  const showList = open && entries.length > 0;

  // Điện thoại: bàn phím ảo không làm khung trang co lại → danh sách gợi ý cao theo phần màn hình còn thấy
  // (visualViewport), và ô tìm lớn trong trang được cuộn lên đầu khi focus để có chỗ cho gợi ý.
  useEffect(() => {
    if (!showList) return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const update = () => {
      const bottom = inputRef.current?.getBoundingClientRect().bottom ?? 0;
      setListMax(Math.max(160, Math.round(vv.height + vv.offsetTop - bottom - 16)));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [showList]);
  const loading = status === 'loading';
  const showEmpty = status === 'empty' && focused;
  const spinner = (
    <span
      aria-hidden="true"
      className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-current/25 border-t-current"
    />
  );

  return (
    <form
      role="search"
      aria-label={searchLabel}
      onSubmit={onSubmit}
      className={`relative w-full ${className}`}
      action="/tim-kiem"
    >
      {/* Ô nhập (kính lúp bên trong) + nút «Tìm» luôn cùng một hàng, kể cả điện thoại 360px. */}
      <div className="flex w-full gap-2">
        {/* Kiểu «hoà dải menu» (chủ dự án chọn 23/11/2026), xem .search-box trong globals.css:
            - nav (trên dải than chì): ô trong suốt viền trắng mờ, chữ trắng, «Tìm» tách bằng vạch mảnh; bấm vào thì
              ô thành nền trắng, nút «Tìm» thành than chì.
            - lg (ô lớn trong trang): nền trắng viền mảnh bo 8px, đổ bóng nhẹ, nút «Tìm» than chì liền bên phải. */}
        <div
          className={`search-box flex min-w-0 flex-1 items-stretch ${
            size === 'nav' ? 'search-box--nav h-11' : 'search-box--lg h-[52px] md:h-14'
          }`}
        >
          <div className="relative min-w-0 flex-1">
            <label
              htmlFor={inputId}
              className="sr-only"
              id={labelledBy ? undefined : `${inputId}-label`}
            >
              {M.search.label}
            </label>
            <span className="search-icon pointer-events-none absolute top-1/2 left-3 flex h-5 w-5 -translate-y-1/2 items-center justify-center md:left-3.5">
              {loading ? spinner : <IconSearch size={20} strokeWidth={2.2} />}
            </span>
            <input
              ref={inputRef}
              id={inputId}
              name="q"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck={false}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showList}
              aria-controls={listId}
              aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
              aria-labelledby={labelledBy}
              aria-busy={loading}
              placeholder={
                (wide && placeholderWide) ||
                placeholder ||
                (narrow
                  ? addon
                    ? M.search.placeholderXs // 360px: ô chỉ còn ~170px chữ
                    : M.search.placeholderNarrow
                  : M.search.placeholder)
              }
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                typedRef.current = true;
                setValue(v);
                // Chữ khác với gợi ý đang hiện: đóng danh sách cũ, bỏ dòng đang chọn (chờ gợi ý mới).
                if (v.trim() !== lastQ) {
                  setOpen(false);
                  setActive(-1);
                  if (status === 'empty') setStatus('idle');
                }
              }}
              onKeyDown={onKeyDown}
              onFocus={() => {
                setFocused(true);
                setArmed(true);
                if (entries.length && fresh) setOpen(true);
                if (size === 'lg' && narrow)
                  setTimeout(() => {
                    const el = inputRef.current;
                    if (el && document.activeElement === el)
                      window.scrollTo({
                        top: el.getBoundingClientRect().top + window.scrollY - 72,
                        behavior: 'smooth',
                      });
                  }, 250);
              }}
              onBlur={() =>
                setTimeout(() => {
                  setOpen(false);
                  setFocused(false);
                }, 150)
              }
              data-size={size}
              className={`search-input h-full w-full appearance-none border-0 bg-transparent pr-1 pl-[42px] text-base text-ellipsis md:pr-3 md:pl-[46px] ${size === 'nav' ? 'md:text-[15px]' : 'md:text-[17px]'}`}
            />
          </div>
          <button
            type="submit"
            className={`search-submit inline-flex h-full flex-none items-center justify-center font-semibold ${size === 'nav' ? 'px-4 text-base md:text-[15px]' : 'px-5 text-[17px] md:px-8'}`}
          >
            {M.search.submit}
          </button>
        </div>
        {addon}
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label={M.search.suggestions}
        hidden={!showList}
        style={listMax ? { maxHeight: `min(70vh, ${listMax}px)` } : undefined}
        className={`motion-drop absolute top-full right-0 left-0 z-40 mt-1.5 max-h-[70vh] overflow-auto rounded-lg border border-line bg-white pt-1 text-left shadow-[0_8px_24px_rgba(22,27,38,0.12)] ${listClassName}`}
      >
        {GROUPS.map(({ kind, label }) => {
          const group = entries.map((e, i) => ({ e, i })).filter(({ e }) => e.kind === kind);
          if (!group.length) return null;
          const options = group.map(({ e, i }) => (
            <li
              key={
                e.kind === 'province'
                  ? `p-${e.p.code}`
                  : e.kind === 'all'
                    ? 'all'
                    : e.kind === 'industry'
                      ? `ind-${e.ind.code}`
                      : e.kind === 'person'
                        ? `person-${e.person.name}`
                        : `${e.kind}-${e.item.mst}`
              }
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(ev) => {
                ev.preventDefault();
                activate(e);
              }}
              onMouseEnter={() => e.kind !== 'all' && router.prefetch(hrefOf(e))}
              style={{ animationDelay: `${Math.min(i, 4) * 20}ms` }}
              // «Xem tất cả kết quả»: dính đáy khung (danh sách dài cuộn bên dưới), không bao giờ bị cắt nửa dòng.
              className={`motion-rise flex min-h-11 cursor-pointer flex-col justify-center gap-0.5 px-4 py-2 ${
                // Dòng đang chọn bằng phím: nền bạc + vạch trái than chì (đủ tương phản, WCAG 1.4.11).
                i === active
                  ? 'bg-silver-2 shadow-[inset_3px_0_0_var(--color-brand)]'
                  : 'hover:bg-brand-50'
              } ${e.kind === 'all' ? `sticky bottom-0 mt-1 border-t border-line ${i === active ? '' : 'bg-white'}` : ''}`}
            >
              <SuggestionRow entry={e} query={lastQ} />
            </li>
          ));
          if (!label) return options;
          const hid = `${listId}-h-${kind}`;
          // Tiêu đề nhóm tách hẳn khỏi các dòng gợi ý: dải nền xám nhạt, chữ xám đậm. Không ghi số dòng (dễ bị
          // hiểu là tổng số kết quả trong khi gợi ý bị giới hạn 8 dòng).
          return (
            <li key={`g-${kind}`} role="none">
              <ul role="group" aria-labelledby={hid}>
                <li
                  id={hid}
                  role="presentation"
                  className="border-y border-line bg-page px-4 py-1.5 text-meta font-semibold text-ink-2"
                >
                  {M.search[label]}
                </li>
                {options}
              </ul>
            </li>
          );
        })}
      </ul>
      {/* Không có gợi ý: báo ngay dưới ô (aria-live để trình đọc màn hình đọc), Enter vẫn tìm được. */}
      <div aria-live="polite" className="sr-only">
        {showEmpty
          ? M.search.noSuggestions(value.trim())
          : showList && status === 'ready'
            ? M.search.suggestionsCount(entries.length - 1)
            : ''}
      </div>
      {showEmpty && (
        <p
          aria-hidden="true"
          className={`motion-drop absolute top-full right-0 left-0 z-40 mt-1.5 rounded-lg border border-line bg-white px-4 py-3 text-left text-sm text-ink-2 shadow-[0_8px_24px_rgba(22,27,38,0.12)] ${listClassName}`}
        >
          {M.search.noSuggestions(value.trim())}
        </p>
      )}
    </form>
  );
}

// Thứ tự nhóm trong danh sách gợi ý; nhóm không có dòng nào thì ẩn cả tiêu đề.
const GROUPS = [
  { kind: 'company', label: 'groupCompanies' },
  { kind: 'rep', label: 'groupRepresentatives' },
  { kind: 'person', label: 'groupRepresentatives' },
  { kind: 'province', label: 'groupProvinces' },
  { kind: 'industry', label: 'groupIndustries' },
  { kind: 'all', label: null },
];

function SuggestionRow({ entry: e, query }) {
  if (e.kind === 'all') {
    return (
      <span className="flex items-center gap-2 text-body font-semibold text-brand">
        <IconSearch size={18} className="flex-none" />
        <span className="line-clamp-1">{M.search.seeAll(query)}</span>
      </span>
    );
  }
  if (e.kind === 'province') {
    return (
      <>
        <span className="text-body font-semibold text-ink">
          <Highlight text={e.p.name} query={query} />
        </span>
        <span className="text-meta text-muted">
          {/* Gõ tên tỉnh cũ («binh duong») → nói rõ nay thuộc tỉnh nào, tránh tưởng gợi ý sai. */}
          {matchedOtherName(query, e.p) && <>{M.search.formerProvince} · </>}
          {M.search.provinceCount(e.p.company_count ?? 0)}
        </span>
      </>
    );
  }
  if (e.kind === 'industry') {
    return (
      <>
        <span className="line-clamp-1 text-body font-semibold text-ink">
          <Highlight text={e.ind.name} query={query} />
        </span>
        <span className="text-meta text-muted tabular-nums">
          {M.search.industryCode(e.ind.code)}
        </span>
      </>
    );
  }
  if (e.kind === 'person') {
    const { person } = e;
    return (
      <>
        <span className="line-clamp-1 text-body font-semibold text-ink">
          <Highlight text={person.name} query={query} />
        </span>
        <span className="line-clamp-1 text-meta text-muted">
          {person.company_count > 1 ? (
            <span className="font-semibold text-brand">
              {M.search.personCompanies(person.company_count)} →
            </span>
          ) : (
            <>
              {M.search.repOf} · {person.company.name}
            </>
          )}
        </span>
      </>
    );
  }
  const { item } = e;
  if (e.kind === 'rep') {
    return (
      <>
        <span className="line-clamp-1 text-body font-semibold text-ink">
          <Highlight text={item.representative} query={query} />
        </span>
        <span className="line-clamp-1 text-meta text-muted">
          {M.search.repOf} · {item.name}
        </span>
      </>
    );
  }
  return (
    <>
      <span className="line-clamp-2 text-body font-semibold text-ink">
        <Highlight text={item.name} query={query} />
      </span>
      <span className="flex flex-wrap items-center gap-x-1 text-meta text-muted">
        <span>
          {M.search.mstPrefix}{' '}
          <span className="tabular-nums">
            <Highlight text={item.mst} query={query} />
          </span>
        </span>
        <span>· {item.province}</span>
        {item.matched === 'phone' && (
          <span className="tag tag-brand ml-1">{M.search.matchedPhone}</span>
        )}
      </span>
    </>
  );
}
