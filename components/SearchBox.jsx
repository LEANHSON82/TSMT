'use client';

// Ô tìm kiếm + gợi ý (spec mục 3.1): gõ từ 2 ký tự, chờ 300 ms mới gọi API, tối đa 8 gợi ý,
// ↑↓ Enter Esc, theo mẫu combobox WAI-ARIA. Enter với MST hợp lệ → vào thẳng trang DN.
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { suggestCompanies } from '@/lib/api';
import { isValidMst, normalizeMst } from '@/lib/mst';
import { track } from '@/lib/analytics';
import { M } from '@/lib/messages';
import Highlight from './Highlight';
import { IconSearch } from './Icons';
import { startNavigation } from './NavigationProgress';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

export default function SearchBox({
  size = 'lg',
  defaultValue = '',
  autoFocusDesktop = false,
  placeholder,
  placeholderWide, // câu dài hơn cho màn hình ≥ 1024px (ô rộng)
  className = '',
  listClassName = '',
  labelledBy,
}) {
  const router = useRouter();
  const uid = useId();
  const inputId = `q-${uid}`;
  const listId = `ql-${uid}`;
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // 'idle' | 'loading' (đang lấy gợi ý) | 'empty' (không có gợi ý) | 'ready'
  const [status, setStatus] = useState('idle');
  const [focused, setFocused] = useState(false);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    if (!placeholderWide) return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [placeholderWide]);

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
    if (q.length < MIN_CHARS) {
      abortRef.current?.abort();
      setItems([]);
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
        const res = await suggestCompanies(q, { signal: ctrl.signal });
        setItems(res.slice(0, 8));
        setOpen(res.length > 0 && document.activeElement === inputRef.current);
        setActive(-1);
        setStatus(res.length ? 'ready' : 'empty');
      } catch (err) {
        if (err?.name !== 'AbortError') {
          setItems([]);
          setOpen(false);
          setStatus('idle');
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Gợi ý đang được chọn (rê chuột / phím mũi tên): tải trước trang DN để bấm vào là hiện ngay.
  useEffect(() => {
    const item = items[active];
    if (item) router.prefetch(`/${item.mst}-${item.slug}`);
  }, [active, items, router]);

  function goTo(item) {
    setOpen(false);
    track('search', { query_type: 'mst', result_count: 1 });
    startNavigation();
    router.push(`/${item.mst}-${item.slug}`);
  }

  function onSubmit(e) {
    e.preventDefault();
    if (open && active >= 0 && items[active]) {
      goTo(items[active]);
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
      router.push(match ? `/${match.mst}-${match.slug}` : `/${mst}`);
      return;
    }
    startNavigation();
    router.push(`/tim-kiem?q=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    }
  }

  const lg = size === 'lg';
  // 'nav': ô tìm trong thanh nav — kính lúp bên trong ô, không có nút «Tìm» (bấm Enter để tìm).
  const nav = size === 'nav';
  const showList = open && items.length > 0;
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
      {/* lg: ô tìm lớn (trang chủ) — ô nhập cao 56px + nút «Tìm» rộng cố định 96px bên phải (điện thoại:
          nút rộng hết chiều ngang dưới ô). nav: ô trên thanh nav — từ 1024px trở lên cùng khuôn với ô
          nhập của lg (cao 56px, chữ 17px), không có nút; HeaderBar đặt nó đúng chỗ ô nhập của lg. */}
      <div className={`flex w-full ${lg ? 'flex-wrap gap-2' : ''}`}>
        <div className={`relative min-w-0 ${lg ? 'flex-[1_1_320px]' : 'flex-1'}`}>
          <label
            htmlFor={inputId}
            className="sr-only"
            id={labelledBy ? undefined : `${inputId}-label`}
          >
            {M.search.label}
          </label>
          {lg && (
            <span className="pointer-events-none absolute top-1/2 left-4 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center text-muted">
              {loading ? spinner : <IconSearch size={22} />}
            </span>
          )}
          {nav && (
            <span className="pointer-events-none absolute top-1/2 left-3.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted lg:left-4 lg:h-[22px] lg:w-[22px]">
              {loading ? (
                spinner
              ) : (
                <IconSearch size={22} className="h-5 w-5 lg:h-[22px] lg:w-[22px]" />
              )}
            </span>
          )}
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
              (lg ? M.search.placeholder : M.search.placeholderShort)
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => {
              setFocused(true);
              if (items.length) setOpen(true);
            }}
            onBlur={() =>
              setTimeout(() => {
                setOpen(false);
                setFocused(false);
              }, 150)
            }
            className={
              lg
                ? 'h-14 w-full rounded-md border border-field bg-white pr-4 pl-[50px] text-[17px] text-ink text-ellipsis placeholder:text-[#6B7280] hover:border-ink-2'
                : nav
                  ? 'h-11 w-full rounded-md border border-field bg-white pr-3 pl-11 text-base text-ink text-ellipsis placeholder:text-[#6B7280] hover:border-ink-2 lg:h-14 lg:pr-4 lg:pl-[50px] lg:text-[17px]'
                  : 'h-11 w-full rounded-l-md border border-r-0 border-field bg-white px-3 text-base text-ink placeholder:text-[#6B7280]'
            }
          />
        </div>
        {lg ? (
          <button
            type="submit"
            className="inline-flex h-14 w-full flex-none items-center justify-center rounded-md bg-cta text-[17px] font-semibold text-white hover:bg-cta-hover sm:w-24"
          >
            {M.search.submit}
          </button>
        ) : nav ? null : (
          <button
            type="submit"
            aria-label={M.search.submit}
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-r-md border border-field bg-brand-50 text-brand hover:bg-[#dfe8fa]"
          >
            {loading ? spinner : <IconSearch size={20} />}
          </button>
        )}
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label={M.search.suggestions}
        hidden={!showList}
        className={`motion-drop absolute top-full right-0 left-0 z-40 mt-1 max-h-[70vh] overflow-auto rounded-md border border-line bg-white py-1 text-left shadow-[0_8px_24px_rgba(10,42,94,0.14)] ${listClassName}`}
      >
        {items.map((item, i) => (
          <li
            key={item.mst}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault();
              goTo(item);
            }}
            onMouseEnter={() => setActive(i)}
            style={{ animationDelay: `${i * 25}ms` }}
            className={`motion-rise flex min-h-11 cursor-pointer flex-col justify-center gap-0.5 px-4 py-2 ${
              i === active ? 'bg-brand-50' : ''
            }`}
          >
            <span className="line-clamp-1 text-[15px] font-semibold text-navy">
              <Highlight text={item.name} query={value} />
            </span>
            <span className="text-[13px] text-muted">
              <span>
                MST{' '}
                <span className="tabular-nums">
                  <Highlight text={item.mst} query={value} />
                </span>
              </span>{' '}
              · {item.province}
            </span>
          </li>
        ))}
      </ul>
      {/* Không có gợi ý: báo ngay dưới ô (aria-live để trình đọc màn hình đọc), Enter vẫn tìm được. */}
      <div aria-live="polite" className="sr-only">
        {showEmpty ? M.search.noSuggestions(value.trim()) : ''}
      </div>
      {showEmpty && (
        <p
          aria-hidden="true"
          className={`motion-drop absolute top-full right-0 left-0 z-40 mt-1 rounded-md border border-line bg-white px-4 py-3 text-left text-sm text-ink-2 shadow-[0_8px_24px_rgba(10,42,94,0.14)] ${listClassName}`}
        >
          {M.search.noSuggestions(value.trim())}
        </p>
      )}
    </form>
  );
}
