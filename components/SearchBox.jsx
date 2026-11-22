'use client';

// Ô tìm kiếm + gợi ý (spec mục 3.1): gõ từ 2 ký tự, chờ 300 ms mới gọi API, tối đa 8 gợi ý DN,
// ↑↓ Enter Esc, theo mẫu combobox WAI-ARIA. Enter với MST hợp lệ → vào thẳng trang DN.
// Gợi ý chia nhóm để người dùng biết khớp ở đâu: «Doanh nghiệp» (khớp tên / MST / SĐT — không bao giờ hiện
// số), «Người đại diện» (hiện tên người + DN họ đại diện), «Tỉnh/thành» (từ danh mục có sẵn), và dòng
// «Xem tất cả kết quả». API chưa trả `matched` thì mọi gợi ý vào nhóm «Doanh nghiệp» như trước.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { suggestCompanies } from '@/lib/api';
import { companyPath, isValidMst, normalizeMst, searchQueryType } from '@/lib/mst';
import { track } from '@/lib/analytics';
import { M } from '@/lib/messages';
import { matchedOtherName, suggestProvinces } from '@/lib/search-intent';
import Highlight from './Highlight';
import { IconSearch } from './Icons';
import { startNavigation } from './NavigationProgress';
import { useProvinces } from './ProvincesContext';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

// size: 'lg' (ô tìm lớn trong trang: trang chủ, 404…) | 'nav' (hàng 2 header). Hệ thiết kế A dùng CÙNG một
// khuôn cho cả hai (cao 52px, điện thoại 48px, nút «Tìm» xanh bên phải) để ô tìm trang chủ và ô tìm header
// trùng khít; size chỉ còn quyết định ô có tự focus không (do trang truyền autoFocusDesktop).
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
    if (q.length < MIN_CHARS || (!suggestPrefilled && !typedRef.current)) {
      abortRef.current?.abort();
      setItems([]);
      setProvItems([]);
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
        const { items: res, people: ppl } = await suggestCompanies(q, { signal: ctrl.signal });
        const provs = suggestProvinces(q, provinces);
        const any = res.length > 0 || provs.length > 0;
        setItems(res.slice(0, 8));
        setPeople(ppl);
        setProvItems(provs);
        setLastQ(q);
        setOpen(any && document.activeElement === inputRef.current);
        setActive(-1);
        setStatus(any ? 'ready' : 'empty');
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setItems([]);
          setPeople(null);
          setProvItems([]);
          setOpen(false);
          setStatus('idle');
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, provinces, suggestPrefilled]);

  // Danh sách phẳng theo thứ tự hiển thị (phím ↑↓ đi qua đúng thứ tự này).
  // Người đại diện: API trả `people` (gộp theo tên, kèm tổng số DN) thì mỗi tên một dòng — một người đứng tên nhiều
  // DN không lặp lại nhiều dòng; không có thì dùng các DN khớp người đại diện như trước. Tổng ≤ 8 (spec 3.1).
  const entries = useMemo(() => {
    const persons = people ? people.slice(0, 4).map((person) => ({ kind: 'person', person })) : [];
    const reps = people
      ? []
      : items.filter((i) => i.matched === 'representative').map((item) => ({ kind: 'rep', item }));
    const companies = items
      .filter((i) => i.matched !== 'representative')
      .slice(0, Math.max(0, 8 - persons.length - reps.length))
      .map((item) => ({ kind: 'company', item }));
    const list = [
      ...companies,
      ...reps,
      ...persons,
      ...provItems.map((p) => ({ kind: 'province', p })),
    ];
    if (list.length) list.push({ kind: 'all' });
    return list;
  }, [items, people, provItems]);

  const hrefOf = (e) =>
    e.kind === 'province'
      ? `/tinh/${e.p.slug}`
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
      onSubmit={onSubmit}
      className={`relative w-full ${className}`}
      action="/tim-kiem"
    >
      {/* Ô nhập (kính lúp bên trong) + nút «Tìm» luôn cùng một hàng, kể cả điện thoại 360px. */}
      <div className="flex w-full gap-2">
        <div className="relative min-w-0 flex-1">
          <label
            htmlFor={inputId}
            className="sr-only"
            id={labelledBy ? undefined : `${inputId}-label`}
          >
            {M.search.label}
          </label>
          <span className="pointer-events-none absolute top-1/2 left-3 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted md:left-3.5">
            {loading ? spinner : <IconSearch size={20} strokeWidth={1.6} />}
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
              if (entries.length && fresh) setOpen(true);
            }}
            onBlur={() =>
              setTimeout(() => {
                setOpen(false);
                setFocused(false);
              }, 150)
            }
            data-size={size}
            className="search-input h-12 w-full appearance-none rounded border border-field bg-white pr-1 pl-[38px] text-base text-ink text-ellipsis placeholder:text-[#6b7483] hover:border-ink-2 md:h-[52px] md:pr-4 md:pl-[46px]"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 flex-none items-center justify-center rounded bg-brand px-2.5 text-base font-semibold text-white hover:bg-brand-hover md:h-[52px] md:px-7"
        >
          {M.search.submit}
        </button>
        {addon}
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label={M.search.suggestions}
        hidden={!showList}
        className={`motion-drop absolute top-full right-0 left-0 z-40 mt-1 max-h-[70vh] overflow-auto rounded border border-line-strong bg-white pt-1 text-left shadow-[0_8px_24px_rgba(22,27,38,0.12)] ${listClassName}`}
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
                i === active ? 'bg-brand-50' : 'hover:bg-brand-50'
              } ${e.kind === 'all' ? `sticky bottom-0 mt-1 border-t border-line ${i === active ? '' : 'bg-white'}` : ''}`}
            >
              <SuggestionRow entry={e} query={lastQ} />
            </li>
          ));
          if (!label) return options;
          const hid = `${listId}-h-${kind}`;
          // Tiêu đề nhóm tách hẳn khỏi các dòng gợi ý: dải nền xám nhạt, chữ xám đậm, có số dòng trong nhóm
          // (hệ A: cam chỉ dành cho logo và nút «Xem số điện thoại»).
          return (
            <li key={`g-${kind}`} role="none">
              <ul role="group" aria-labelledby={hid}>
                <li
                  id={hid}
                  role="presentation"
                  className="flex items-center justify-between border-y border-line bg-page px-4 py-1.5 text-meta font-semibold text-ink-2"
                >
                  <span>{M.search[label]}</span>
                  <span className="font-semibold text-muted tabular-nums" aria-hidden="true">
                    {group.length}
                  </span>
                </li>
                {options}
              </ul>
            </li>
          );
        })}
      </ul>
      {/* Không có gợi ý: báo ngay dưới ô (aria-live để trình đọc màn hình đọc), Enter vẫn tìm được. */}
      <div aria-live="polite" className="sr-only">
        {showEmpty ? M.search.noSuggestions(value.trim()) : ''}
      </div>
      {showEmpty && (
        <p
          aria-hidden="true"
          className={`motion-drop absolute top-full right-0 left-0 z-40 mt-1 rounded border border-line-strong bg-white px-4 py-3 text-left text-sm text-ink-2 shadow-[0_8px_24px_rgba(22,27,38,0.12)] ${listClassName}`}
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
