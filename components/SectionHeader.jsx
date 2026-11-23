import Link from 'next/link';
import { M } from '@/lib/messages';

// Tiêu đề khối kiểu CafeF. tab (mặc định): đặt ở đầu một khung .panel — tiêu đề nằm trong ô nền than chì chữ trắng
// sát góc trái khung, vạch mảnh dưới; phần phụ bên phải CÙNG hàng: số đếm (meta) và/hoặc link (action).
// tab={false}: tiêu đề chữ đậm thường (đặt ngoài khung).
//   id      — gắn vào thẻ tiêu đề, để <section aria-labelledby={id}>.
//   as      — 'h2' (mặc định) | 'h3'.
//   meta    — chữ phụ xám, vd «34 tỉnh/thành» (không xuống dòng).
//   action  — { href, label?, shortLabel? } → link «Xem tất cả ›»; dưới 440px dùng shortLabel.
export default function SectionHeader({
  id,
  title,
  as: Tag = 'h2',
  meta,
  action,
  tab = true,
  className = '',
}) {
  const side = (meta || action) && (
    <div
      className={`flex flex-none items-center gap-3 whitespace-nowrap md:gap-4 ${tab ? 'pr-4 pl-3 md:pr-5' : ''}`}
    >
      {meta && <span className="text-sm text-muted tabular-nums">{meta}</span>}
      {action && (action.href ? <SectionAction {...action} /> : action)}
    </div>
  );
  if (!tab) {
    return (
      <div className={`flex items-baseline justify-between gap-3 pb-3 md:gap-4 ${className}`}>
        <Tag
          id={id}
          className="min-w-0 text-[18px] leading-7 font-semibold text-pretty text-ink md:text-[20px]"
        >
          {title}
        </Tag>
        {side}
      </div>
    );
  }
  return (
    <div className={`flex items-stretch justify-between gap-2 border-b border-line ${className}`}>
      <Tag
        id={id}
        className="min-w-0 bg-chrome px-4 py-2.5 text-base leading-6 font-semibold text-pretty text-white md:px-5 md:py-3 md:text-[18px] md:leading-[26px]"
      >
        {title}
      </Tag>
      {side}
    </div>
  );
}

function SectionAction({ href, label = M.home.viewAll, shortLabel = M.home.viewAllShort }) {
  const short = shortLabel && shortLabel !== label;
  return (
    // Vùng bấm cao 44px nhưng -my-2 để không đẩy chiều cao hàng tiêu đề. Tên đọc (aria-label) luôn là câu
    // đầy đủ, chứa chữ ngắn đang hiện (WCAG 2.5.3).
    <Link
      href={href}
      aria-label={short ? label : undefined}
      className="group -my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold no-underline hover:underline hover:underline-offset-[3px]"
    >
      {short ? (
        <>
          <span className="min-[440px]:hidden">{shortLabel}</span>
          <span className="max-[439px]:hidden">{label}</span>
        </>
      ) : (
        label
      )}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="flex-none transition-transform duration-150 group-hover:translate-x-0.5"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
