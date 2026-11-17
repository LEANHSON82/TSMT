'use client';

// Bộ lọc danh sách (spec mục 3.2): đổi lọc thì cập nhật URL (giữ được khi chia sẻ link, khi bấm Back).
// Là <form method="get"> thật nên vẫn chạy khi JS chưa tải; có JS thì tự áp dụng khi đổi lựa chọn.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { M } from '@/lib/messages';
import { buildHref } from '@/lib/url';
import { armNavFallback, startNavigation } from './NavigationProgress';

/**
 * fields: [{ name, label, value, allLabel, options: [{ value, label }], filter? }]
 *   filter: false — không phải bộ lọc (vd. «Sắp xếp»): không đếm, không hiện thẻ, «Bỏ lọc» giữ nguyên.
 * hidden: tham số giữ nguyên (vd. { q })
 * Bộ lọc đang bật hiện thành thẻ có nút × (bấm để bỏ riêng bộ lọc đó), cả trên điện thoại khi bảng lọc
 * đang thu gọn.
 */
// Ô vừa đổi trước khi chuyển trang — trang mới dựng lại bộ lọc thì đưa focus về đúng ô đó.
let refocusName = null;
const KEY_NAV = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
];

export default function ListFilters({ action, fields, hidden = {} }) {
  const router = useRouter();
  const formRef = useRef(null);
  const [open, setOpen] = useState(false);
  // Chuột/chạm: đổi lựa chọn là áp dụng ngay. Bàn phím (mũi tên, gõ chữ): chỉ áp dụng khi Enter hoặc rời
  // ô — không chuyển trang sau mỗi lần nhấn phím (WCAG 3.2.2).
  const keyboardRef = useRef(false);
  const pendingRef = useRef(null);
  useEffect(() => {
    if (!refocusName) return;
    formRef.current?.querySelector(`[name="${refocusName}"]`)?.focus();
    refocusName = null;
  }, []);
  const commit = (name) => {
    pendingRef.current = null;
    refocusName = name;
    apply();
  };
  const uid = useId();
  const isFilter = (f) => f.filter !== false;
  const activeCount = fields.filter((f) => f.value && isFilter(f)).length;
  const current = Object.fromEntries(fields.map((f) => [f.name, f.value || '']));
  const keep = Object.fromEntries(
    fields.filter((f) => !isFilter(f)).map((f) => [f.name, f.value || '']),
  );
  const chips = fields
    .filter((f) => f.value && isFilter(f))
    .map((f) => ({
      name: f.name,
      label: f.options.find((o) => o.value === f.value)?.label || f.value,
      href: buildHref(action, { ...hidden, ...current, [f.name]: '' }),
    }));

  function apply() {
    const data = new FormData(formRef.current);
    const params = { ...hidden };
    for (const f of fields) params[f.name] = data.get(f.name) || '';
    const href = buildHref(action, params);
    startNavigation();
    router.push(href);
    // Dự phòng khi router của Next bỏ qua lệnh chuyển trang cùng đường dẫn (xem NavigationProgress).
    armNavFallback(href);
  }

  const summary = fields
    .map((f) => f.options.find((o) => o.value === f.value)?.label || f.allLabel)
    .join(' · ');

  const controls = (
    <div className="grid gap-3 md:grid-cols-2 md:items-end md:gap-x-4 lg:grid-cols-4">
      {fields.map((f) => (
        <div key={f.name} className="flex min-w-0 flex-col gap-1">
          <label htmlFor={`${uid}-${f.name}`} className="text-sm font-semibold text-ink-2">
            {f.label}
          </label>
          <select
            id={`${uid}-${f.name}`}
            name={f.name}
            defaultValue={f.value || ''}
            onPointerDown={() => {
              keyboardRef.current = false;
            }}
            onKeyDown={(e) => {
              if (KEY_NAV.includes(e.key) || e.key.length === 1) keyboardRef.current = true;
              if (e.key === 'Enter' && pendingRef.current === f.name) {
                e.preventDefault();
                commit(f.name);
              }
            }}
            onChange={() => {
              if (keyboardRef.current) pendingRef.current = f.name;
              else commit(f.name);
            }}
            onBlur={() => {
              keyboardRef.current = false;
              if (pendingRef.current === f.name) commit(f.name);
            }}
            className="select-chevron h-11 w-full cursor-pointer rounded-md border border-field bg-white px-3 text-body text-ink hover:border-ink-2"
          >
            <option value="">{f.allLabel}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <noscript>
        <button type="submit" className="h-11 rounded-md bg-brand px-5 font-semibold text-white">
          {M.list.applyFilter}
        </button>
      </noscript>
      {activeCount > 0 && (
        <Link
          href={buildHref(action, { ...hidden, ...keep })}
          className="inline-flex min-h-11 items-center text-body font-semibold"
        >
          {M.list.clearFilter}
        </Link>
      )}
    </div>
  );

  return (
    <form
      ref={formRef}
      method="get"
      action={action}
      onSubmit={(e) => (e.preventDefault(), apply())}
    >
      {Object.entries(hidden).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      {/* Điện thoại: thu gọn sau nút «Lọc»; máy tính: hiện ngay */}
      <div className="rounded-xl border border-line bg-white md:border-0 md:bg-transparent">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${uid}-panel`}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left md:hidden"
        >
          <span className="flex items-center gap-2 font-semibold text-brand">
            {M.list.filter}
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs text-white">
                {activeCount}
              </span>
            )}
          </span>
          <span className="truncate text-sm text-muted">{summary}</span>
        </button>
        <div
          id={`${uid}-panel`}
          className={`${open ? 'motion-drop block' : 'hidden'} border-t border-line-soft px-4 pt-3 pb-4 md:block md:border-0 md:p-0`}
        >
          {controls}
        </div>
      </div>
      {chips.length > 0 && (
        <ul aria-label={M.list.activeFilters} className="mt-1 flex flex-wrap gap-x-2">
          {chips.map((c) => (
            <li key={c.name}>
              {/* Vùng bấm cao 44px (spec 7.3), phần nhìn thấy là viên thuốc gọn bên trong. */}
              <Link
                href={c.href}
                aria-label={M.list.removeFilter(c.label)}
                className="group inline-flex min-h-11 items-center no-underline"
              >
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand/30 bg-brand-50 pr-2.5 pl-3 text-sm font-semibold text-brand-hover group-hover:border-brand">
                  {c.label}
                  <span aria-hidden="true" className="text-base leading-none">
                    ×
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
