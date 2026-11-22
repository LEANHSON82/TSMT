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

// Khung chờ cùng dáng thẻ thật (CompanyCard variant="row") → khi dữ liệu về, trang không nhảy bố cục.
export function ListSkeleton({ rows = 6 }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <ul aria-hidden="true" className="flex flex-col gap-3 md:gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="card px-4 py-3.5 md:py-0">
            <div className="flex flex-col gap-2 md:hidden">
              <span className="skeleton h-4 w-4/5 rounded-sm" />
              <span className="skeleton h-4 w-1/2 rounded-sm" />
              <span className="skeleton h-3 w-3/5 rounded-sm" />
              <span className="skeleton h-3 w-2/5 rounded-sm" />
            </div>
            <div className="hidden md:block">
              <div className="flex items-center justify-between border-b border-line pt-4 pb-3.5">
                <span className="skeleton h-5 w-1/2 rounded-sm" />
                <span className="skeleton h-4 w-28 rounded-sm" />
              </div>
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-x-8 pt-3 pb-4">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="flex flex-col gap-2">
                    <span className="skeleton h-3 w-20 rounded-sm" />
                    <span className="skeleton h-4 w-4/5 rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
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
