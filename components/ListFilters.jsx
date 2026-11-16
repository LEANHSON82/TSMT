'use client';

// Bộ lọc danh sách (spec mục 3.2): đổi lọc thì cập nhật URL (giữ được khi chia sẻ link, khi bấm Back).
// Là <form method="get"> thật nên vẫn chạy khi JS chưa tải; có JS thì tự áp dụng khi đổi lựa chọn.
import { useRouter } from 'next/navigation';
import { useId, useRef, useState } from 'react';
import { M } from '@/lib/messages';
import { buildHref } from '@/lib/url';
import { startNavigation } from './NavigationProgress';

/**
 * fields: [{ name, label, value, allLabel, options: [{ value, label }], filter? }]
 *   filter: false — không phải bộ lọc (vd. «Sắp xếp»): không đếm, không hiện thẻ, «Bỏ lọc» giữ nguyên.
 * hidden: tham số giữ nguyên (vd. { q })
 * Bộ lọc đang bật hiện thành thẻ có nút × (bấm để bỏ riêng bộ lọc đó), cả trên điện thoại khi bảng lọc
 * đang thu gọn.
 */
export default function ListFilters({ action, fields, hidden = {} }) {
  const router = useRouter();
  const formRef = useRef(null);
  const [open, setOpen] = useState(false);
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
    // Dự phòng: router của Next đôi khi bỏ qua lệnh chuyển trang nếu gọi quá sớm sau khi trang vừa tải
    // (lặp lại được ~1/10 lần trong test e2e). Sau 3 giây URL vẫn chưa đổi thì tải trang thường.
    const target = new URL(href, window.location.href);
    const key = (u) => `${u.pathname}?${[...u.searchParams].sort().join('&')}`; // bỏ qua khác biệt + / %20
    setTimeout(() => {
      if (key(new URL(window.location.href)) !== key(target)) window.location.assign(target.href);
    }, 3000);
  }

  const summary = fields
    .map((f) => f.options.find((o) => o.value === f.value)?.label || f.allLabel)
    .join(' · ');

  const controls = (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-x-4">
      {fields.map((f) => (
        <div key={f.name} className="flex min-w-0 flex-col gap-1 md:w-60">
          <label htmlFor={`${uid}-${f.name}`} className="text-sm font-semibold text-ink-2">
            {f.label}
          </label>
          <select
            id={`${uid}-${f.name}`}
            name={f.name}
            defaultValue={f.value || ''}
            onChange={apply}
            className="select-chevron h-11 w-full cursor-pointer rounded-md border border-field bg-white px-3 text-[15px] text-ink hover:border-ink-2"
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
        <a
          href={buildHref(action, { ...hidden, ...keep })}
          className="inline-flex min-h-11 items-center text-[15px] font-semibold"
        >
          {M.list.clearFilter}
        </a>
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
              <a
                href={c.href}
                aria-label={M.list.removeFilter(c.label)}
                onClick={() => startNavigation()}
                className="group inline-flex min-h-11 items-center no-underline"
              >
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand/30 bg-brand-50 pr-2.5 pl-3 text-sm font-semibold text-brand-hover group-hover:border-brand">
                  {c.label}
                  <span aria-hidden="true" className="text-base leading-none">
                    ×
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
