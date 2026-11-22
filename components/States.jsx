import Link from 'next/link';
import { M } from '@/lib/messages';

// Trạng thái rỗng: một thẻ trắng như thẻ DN, tiêu đề + gợi ý (spec mục 3: câu thông báo + gợi ý).
export function EmptyState({ title, hints = [], children }) {
  return (
    <div className="card flex flex-col gap-2 px-5 py-5 md:px-6 md:py-6">
      <h2 className="text-[18px] leading-7 font-semibold text-ink">{title}</h2>
      {hints.length > 0 && (
        <ul className="flex max-w-[640px] list-disc flex-col gap-1 pl-5 text-body text-ink-2">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

export { default as ErrorState } from './ErrorState';

// Khung chờ cùng dáng danh sách thật (khung trắng, các dòng) → khi dữ liệu về, trang không nhảy bố cục.
export function ListSkeleton({ rows = 6 }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <ul aria-hidden="true" className="panel">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className="flex flex-col gap-2 border-b border-line-soft px-4 py-4 last:border-b-0 md:px-5"
          >
            <span className="skeleton h-4 w-3/5 rounded-sm" />
            <span className="skeleton h-3 w-4/5 rounded-sm" />
            <span className="skeleton h-3 w-2/5 rounded-sm" />
          </li>
        ))}
      </ul>
      <span className="sr-only">{M.common.loading}</span>
    </div>
  );
}

export function BackHomeLink() {
  return (
    <Link href="/" className="font-semibold">
      {M.notFound.home}
    </Link>
  );
}
