import Link from 'next/link';
import { M } from '@/lib/messages';
import { formatNumber } from '@/lib/format';

// Tab «Tìm theo» trên trang kết quả: Tất cả · Tên DN · Người đại diện · MST/SĐT, kèm số kết quả từng mục
// (khi API trả counts). Mục không có kết quả thì không bấm được. Là link thường (giữ trên URL, Back được).
export const FIELD_TABS = [
  { value: '', field: undefined, countKey: 'all', label: 'fieldAll' },
  { value: 'ten', field: 'name', countKey: 'name', label: 'fieldName' },
  {
    value: 'dai-dien',
    field: 'representative',
    countKey: 'representative',
    label: 'fieldRepresentative',
  },
  { value: 'so', field: 'number', countKey: 'number', label: 'fieldNumber' },
];

export default function SearchFieldTabs({ active, counts, hrefFor }) {
  return (
    <nav aria-label={M.search.fieldTabs} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {FIELD_TABS.map((t) => {
          const n = counts?.[t.countKey];
          const current = t.value === active;
          const inner = (
            <>
              {M.search[t.label]}
              {n != null && (
                <span
                  className={`rounded-full px-1.5 text-xs tabular-nums ${current ? 'bg-brand-50 text-brand-hover' : 'bg-line-soft text-muted'}`}
                >
                  {formatNumber(n)}
                </span>
              )}
            </>
          );
          const cls = `-mb-px inline-flex min-h-11 items-center gap-1.5 border-b-2 px-3 text-[15px] font-semibold whitespace-nowrap no-underline`;
          return (
            <li key={t.countKey}>
              {current ? (
                <span aria-current="page" className={`${cls} border-brand text-brand`}>
                  {inner}
                </span>
              ) : n === 0 ? (
                <span aria-disabled="true" className={`${cls} border-transparent text-muted/70`}>
                  {inner}
                </span>
              ) : (
                <Link
                  href={hrefFor(t.value)}
                  className={`${cls} border-transparent text-ink-2 hover:text-brand`}
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
