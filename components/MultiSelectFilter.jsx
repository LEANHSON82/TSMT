'use client';

// Ô lọc chọn nhiều (tỉnh/thành, ngành nghề) trong ListFilters: bấm mở danh sách ô tích + ô tìm nhanh (gõ không
// dấu, gõ mã ngành), tích xong bấm «Áp dụng» mới chuyển trang — không tải lại sau mỗi lần tích.
// Esc / bấm ra ngoài: đóng, bỏ các lựa chọn chưa áp dụng.
// Dựng trên <details> + checkbox name={name}: chưa có JS vẫn mở được và gửi form (?tinh=a&tinh=b).
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { M } from '@/lib/messages';
import { toSlug } from '@/lib/slug';

const norm = (s) => toSlug(s).replace(/-/g, ' ');

export default function MultiSelectFilter({
  name,
  label,
  allLabel,
  options,
  value,
  searchLabel,
  onApply,
}) {
  const uid = useId();
  const detailsRef = useRef(null);
  const summaryRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [query, setQuery] = useState('');
  const valueKey = value.join(',');
  // Mục đã chọn lên đầu danh sách (thấy ngay đang lọc gì), còn lại giữ thứ tự gốc.
  const ordered = useMemo(() => {
    const chosen = new Set(valueKey ? valueKey.split(',') : []);
    return [
      ...options.filter((o) => chosen.has(o.value)),
      ...options.filter((o) => !chosen.has(o.value)),
    ];
  }, [options, valueKey]);
  const index = useMemo(() => ordered.map((o) => norm(o.label)), [ordered]);
  const q = norm(query);
  // Có gõ tìm: mục có từ BẮT ĐẦU bằng chữ gõ lên trước («ha» → Hà Nội, Hà Tĩnh… rồi mới tới Đồng Tháp).
  const rank = (i) => {
    if (!q) return 0;
    const t = index[i];
    if (t.startsWith(q) || t.includes(` ${q}`)) return 1;
    return t.includes(q) ? 2 : 0;
  };
  const display = ordered
    .map((o, i) => ({ o, i, r: rank(i) }))
    .filter((x) => !q || x.r > 0)
    .sort((a, b) => a.r - b.r || a.i - b.i);
  const shown = new Set(display.map((x) => x.o.value));
  // Mục bị lọc đi vẫn nằm trong form (ẩn) để form gửi được khi chưa có JS.
  const rows = [...display.map((x) => x.o), ...ordered.filter((o) => !shown.has(o.value))];
  const anyVisible = display.length > 0;

  // Đóng (hoặc giá trị đã áp dụng đổi) → bỏ lựa chọn nháp; mở → đưa con trỏ vào ô tìm.
  useEffect(() => {
    if (open) {
      searchRef.current?.focus({ preventScroll: true });
      return;
    }
    setDraft(valueKey ? valueKey.split(',') : []);
    setQuery('');
  }, [open, valueKey]);

  function close(returnFocus) {
    if (detailsRef.current) detailsRef.current.open = false;
    setOpen(false);
    if (returnFocus) summaryRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!detailsRef.current?.contains(e.target)) close(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const apply = () => {
    close(true);
    if (draft.join(',') !== valueKey) onApply(draft);
  };
  const toggle = (v) => setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));

  const selected = options.filter((o) => value.includes(o.value));
  const summary = selected.length
    ? M.search.multiSummary(selected[0].label, selected.length)
    : allLabel;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={`${uid}-label`} className="text-meta font-semibold text-muted">
        {label}
      </span>
      <details
        ref={detailsRef}
        className="relative"
        onToggle={(e) => setOpen(e.currentTarget.open)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && open) {
            e.preventDefault();
            close(true);
          }
        }}
        onBlur={(e) => {
          // Tab ra khỏi ô → đóng. relatedTarget null (bấm vào chỗ trống trong bảng) → không đóng;
          // bấm ra ngoài do pointerdown ở trên lo.
          const to = e.relatedTarget;
          if (open && to && !e.currentTarget.contains(to)) close(false);
        }}
      >
        <summary
          ref={summaryRef}
          aria-labelledby={`${uid}-label ${uid}-value`}
          className="select-chevron flex h-11 w-full cursor-pointer list-none items-center rounded border border-line-strong bg-white px-3 text-body text-ink hover:border-ink-2 [&::-webkit-details-marker]:hidden"
        >
          <span id={`${uid}-value`} className="truncate">
            {summary}
          </span>
        </summary>
        <div className="motion-drop absolute top-full left-0 z-30 mt-1 flex w-full min-w-[min(320px,calc(100vw-2rem))] flex-col rounded border border-line-strong bg-white shadow-[0_6px_20px_rgba(22,27,38,0.12)]">
          <div className="border-b border-line p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Enter trong ô tìm: áp dụng lựa chọn (không gửi form với giá trị cũ).
                if (e.key === 'Enter') {
                  e.preventDefault();
                  apply();
                }
              }}
              aria-label={searchLabel}
              placeholder={searchLabel}
              autoComplete="off"
              className="h-11 w-full rounded border border-line-strong px-3 text-body text-ink placeholder:text-muted"
            />
          </div>
          <fieldset className="max-h-64 overflow-y-auto overscroll-contain p-1">
            <legend className="sr-only">{label}</legend>
            {rows.map((o) => (
              <label
                key={o.value}
                className={`${shown.has(o.value) ? 'flex' : 'hidden'} min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2 text-body text-ink hover:bg-surface`}
              >
                <input
                  type="checkbox"
                  name={name}
                  value={o.value}
                  checked={draft.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="h-[18px] w-[18px] flex-none accent-brand"
                />
                <span className="min-w-0">{o.label}</span>
              </label>
            ))}
            {!anyVisible && <p className="px-2 py-3 text-sm text-muted">{M.search.multiNoMatch}</p>}
          </fieldset>
          <div className="flex items-center justify-between gap-2 border-t border-line p-2">
            <button
              type="button"
              onClick={() => setDraft([])}
              disabled={!draft.length}
              className="h-11 rounded px-3 text-body font-semibold text-brand hover:bg-surface disabled:text-muted disabled:hover:bg-transparent"
            >
              {M.search.multiClear}
            </button>
            <span className="sr-only" aria-live="polite">
              {M.search.multiCount(draft.length)}
            </span>
            <button
              type="button"
              onClick={apply}
              className="press h-11 rounded bg-brand px-4 text-body font-semibold text-white hover:bg-brand-hover"
            >
              {M.search.multiApply}
              {draft.length ? ` (${draft.length})` : ''}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
