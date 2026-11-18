'use client';

// Bộ lọc danh sách (spec mục 3.2): đổi lọc thì cập nhật URL (giữ được khi chia sẻ link, khi bấm Back).
// Là <form method="get"> thật nên vẫn chạy khi JS chưa tải; có JS thì tự áp dụng khi đổi lựa chọn.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { M } from '@/lib/messages';
import { buildHref } from '@/lib/url';
import { armNavFallback, startNavigation } from './NavigationProgress';
import MultiSelectFilter from './MultiSelectFilter';

/**
 * fields: [{ name, label, value, allLabel, options: [{ value, label, chip? }], filter?, multiple?, searchLabel? }]
 *   filter: false — không phải bộ lọc (vd. «Sắp xếp»): không đếm, không hiện thẻ, «Bỏ lọc» giữ nguyên.
 *   multiple: true — chọn nhiều (MultiSelectFilter), value là mảng, URL dạng ?tinh=a,b; mỗi lựa chọn một thẻ ×.
 *   chip: nhãn trên thẻ bộ lọc nếu khác nhãn trong danh sách (vd. «Thành lập trong 30 ngày qua»).
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
  const has = (f) => (f.multiple ? f.value?.length > 0 : Boolean(f.value));
  const urlValue = (f) => (f.multiple ? (f.value || []).join(',') : f.value || '');
  const optionOf = (f, v) => f.options.find((o) => o.value === v);
  const current = Object.fromEntries(fields.map((f) => [f.name, urlValue(f)]));
  const keep = Object.fromEntries(
    fields.filter((f) => !isFilter(f)).map((f) => [f.name, urlValue(f)]),
  );
  const chips = fields
    .filter((f) => has(f) && isFilter(f))
    .flatMap((f) =>
      (f.multiple ? f.value : [f.value]).map((v) => ({
        key: `${f.name}:${v}`,
        label: optionOf(f, v)?.chip || optionOf(f, v)?.label || v,
        href: buildHref(action, {
          ...hidden,
          ...current,
          [f.name]: f.multiple ? f.value.filter((x) => x !== v).join(',') : '',
        }),
      })),
    );
  // Số trên nút «Lọc» (điện thoại) = số thẻ bộ lọc bên dưới (2 tỉnh + thời gian = 3).
  const activeCount = chips.length;

  /** overrides: { name: giá trị } — ô chọn nhiều gửi lựa chọn vừa áp dụng (mảng). */
  function apply(overrides = {}) {
    const data = new FormData(formRef.current);
    const params = { ...hidden };
    for (const f of fields) {
      // Ô chọn nhiều: lấy giá trị đã áp dụng (không lấy ô tích nháp đang mở trong form).
      params[f.name] = f.multiple ? urlValue(f) : data.get(f.name) || '';
    }
    for (const [k, v] of Object.entries(overrides)) params[k] = Array.isArray(v) ? v.join(',') : v;
    const href = buildHref(action, params);
    startNavigation();
    router.push(href);
    // Dự phòng khi router của Next bỏ qua lệnh chuyển trang cùng đường dẫn (xem NavigationProgress).
    armNavFallback(href);
  }

  const summary = fields
    .map((f) =>
      f.multiple
        ? f.value?.length
          ? M.search.multiSummary(optionOf(f, f.value[0])?.label || f.value[0], f.value.length)
          : f.allLabel
        : optionOf(f, f.value)?.label || f.allLabel,
    )
    .join(' · ');

  const cols =
    fields.length >= 5
      ? 'lg:grid-cols-5'
      : fields.length >= 4
        ? 'lg:grid-cols-4'
        : 'lg:grid-cols-3';
  const controls = (
    <div className={`grid gap-3 md:grid-cols-2 md:items-end md:gap-x-4 ${cols}`}>
      {fields.map((f) =>
        f.multiple ? (
          <MultiSelectFilter
            key={f.name}
            name={f.name}
            label={f.label}
            allLabel={f.allLabel}
            options={f.options}
            value={f.value || []}
            searchLabel={f.searchLabel}
            onApply={(v) => {
              refocusName = null;
              apply({ [f.name]: v });
            }}
          />
        ) : (
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
        ),
      )}
      <noscript>
        <button type="submit" className="h-11 rounded-md bg-brand px-5 font-semibold text-white">
          {M.list.applyFilter}
        </button>
      </noscript>
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
            <li key={c.key} className="max-w-full">
              {/* Vùng bấm cao 44px (spec 7.3), phần nhìn thấy là thẻ gọn bên trong. Nhãn dài (tên ngành) xuống
                  dòng trong thẻ: cao theo chữ, có đệm trên dưới — không cố định chiều cao (chữ tràn ra viền). */}
              <Link
                href={c.href}
                aria-label={M.list.removeFilter(c.label)}
                className="group inline-flex min-h-11 max-w-full items-center no-underline"
              >
                <span className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-2xl border border-brand/30 bg-brand-50 py-1 pr-2.5 pl-3 text-sm leading-5 font-semibold text-brand-hover group-hover:border-brand">
                  <span className="min-w-0">{c.label}</span>
                  <span aria-hidden="true" className="flex-none text-base leading-none">
                    ×
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {/* «Bỏ lọc» (bỏ hết, giữ sắp xếp) đứng cuối hàng thẻ. */}
          <li>
            <Link
              href={buildHref(action, { ...hidden, ...keep })}
              className="inline-flex min-h-11 items-center px-1 text-sm font-semibold"
            >
              {M.list.clearFilter}
            </Link>
          </li>
        </ul>
      )}
    </form>
  );
}
