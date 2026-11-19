import Link from 'next/link';
import { M } from '@/lib/messages';

// Tiêu đề khối hệ A: vạch ngang 2px màu chữ đậm ở trên (như đầu bảng sổ đăng ký), tiêu đề 20px bên trái
// (điện thoại 18px), phần phụ bên phải CÙNG hàng: số đếm (meta) và/hoặc link (action).
//   id      — gắn vào thẻ tiêu đề, để <section aria-labelledby={id}>.
//   as      — 'h2' (mặc định) | 'h3'.
//   meta    — chữ phụ xám, vd «34 tỉnh/thành» (không xuống dòng).
//   action  — { href, label?, shortLabel? } → link «Xem tất cả →»; dưới 440px dùng shortLabel («Tất cả») để
//             tiêu đề + link vẫn một hàng ở 360px. Truyền sẵn một phần tử React nếu cần nội dung khác.
// Bên phải không bao giờ xuống dòng (flex-none, nowrap); tiêu đề quá dài thì tự xuống dòng bên trái.
// Điện thoại: link 14px, khe 12px — «Doanh nghiệp mới thành lập» + «Tất cả →» vừa một hàng ở 360px. Có cả
// meta lẫn action thì tiêu đề dài sẽ xuống dòng ở 360px: khi đó nên bỏ meta trên điện thoại.
export default function SectionHeader({ id, title, as: Tag = 'h2', meta, action, className = '' }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 border-t-2 border-ink pt-3 pb-2 md:gap-4 ${className}`}
    >
      <Tag id={id} className="min-w-0 text-h2-m font-semibold text-pretty text-ink md:text-h2">
        {title}
      </Tag>
      {(meta || action) && (
        <div className="flex flex-none items-baseline gap-3 whitespace-nowrap md:gap-4">
          {meta && <span className="text-sm text-muted tabular-nums">{meta}</span>}
          {action && (action.href ? <SectionAction {...action} /> : action)}
        </div>
      )}
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
      className="group -my-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold no-underline hover:underline hover:underline-offset-[3px] md:gap-1.5 md:text-base"
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
