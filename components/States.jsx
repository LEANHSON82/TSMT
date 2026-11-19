import Link from 'next/link';
import { M } from '@/lib/messages';
import { ROW_COLS } from './CompanyCard';

// Hệ A: trạng thái rỗng / chờ nằm đúng chỗ của bảng danh sách — mở đầu bằng vạch 2px như bảng, căn trái,
// không hộp bo góc, không hình minh hoạ (giống một sổ đăng ký không có dòng nào).
export function EmptyState({ title, hints = [], children }) {
  return (
    <div className="flex flex-col gap-2 border-t-2 border-ink pt-5 pb-2 md:pt-6">
      <h2 className="text-h2-m font-semibold text-ink md:text-h2">{title}</h2>
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

// Khung chờ cùng dáng bảng thật → khi dữ liệu về, trang không nhảy bố cục:
//   từ 1024px: hàng tiêu đề cột + dòng (tên / địa chỉ và 4 cột, ROW_COLS) cao 78px như dòng 1 dòng tên;
//   dưới 1024px: thẻ gọn ~140px — tên 2 dòng + nhãn tình trạng bên phải, «MST · ngày», địa chỉ, đại diện.
// Mỗi dòng chữ là một hộp cao đúng line-height của chữ thật (24 / 20), thanh xám nằm giữa.
export function ListSkeleton({ rows = 6 }) {
  const bar = (box, w, extra = '') => (
    <span className={`flex items-center ${box} ${extra}`}>
      <span className={`skeleton rounded-sm ${w}`} />
    </span>
  );
  return (
    <div aria-busy="true" aria-live="polite">
      <div
        aria-hidden="true"
        className={`hidden border-t-2 border-b border-ink border-b-line-strong py-2.5 lg:grid ${ROW_COLS}`}
      >
        {[160, 80, 96, 88, 72].map((w, i) => (
          <span key={i} className="skeleton my-1 h-3 rounded-sm" style={{ width: w }} />
        ))}
      </div>
      <ul aria-hidden="true" className="border-t-2 border-ink lg:border-t-0">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-b border-line py-3 lg:items-start lg:py-4 ${ROW_COLS}`}
          >
            <div className="flex min-w-0 flex-col">
              {bar('h-6', 'h-4 w-4/5 lg:w-3/5')}
              {bar('h-6', 'h-4 w-1/2', 'lg:hidden')}
              {bar('mt-1 h-5', 'h-3 w-3/5', 'lg:hidden')}
              {bar('mt-0.5 h-5', 'h-3 w-1/2 lg:w-2/5')}
              {bar('mt-0.5 h-5', 'h-3 w-2/5', 'lg:hidden')}
            </div>
            <span className="skeleton h-6 w-28 rounded-sm lg:hidden" />
            {bar('h-6', 'h-4 w-24', 'hidden lg:flex')}
            {bar('h-6', 'h-4 w-28', 'hidden lg:flex')}
            {bar('h-6', 'h-4 w-20', 'hidden lg:flex')}
            <span className="skeleton hidden h-6 w-28 rounded-sm lg:block" />
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
