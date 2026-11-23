import { STATUS_LABELS } from '@/lib/messages';

// Tình trạng DN (spec mục 3.3), kiểu BizLookup: nhãn tròn viền mảnh — xanh lá (xanh ngọc) khi đang hoạt động (✓),
// xám khi ngừng / đóng MST (⊘). Chữ + icon cùng báo trạng thái nên không phụ thuộc riêng vào màu (WCAG 1.4.1).
// plain: chỉ icon + chữ màu (không nền / viền) — dùng trong bảng danh sách để 20 nhãn liền nhau không thành một cột
// khối xanh gây nhiễu. Vẫn xanh lá (đang hoạt động) / xám (ngừng, đóng) theo spec 3.3.
export default function StatusBadge({ status, plain = false, className = '' }) {
  const code = status?.code || 'active';
  const label = status?.label || STATUS_LABELS[code] || code;
  const active = code === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${
        plain
          ? `text-[13px] leading-5 ${active ? 'text-ok' : 'text-off'}`
          : `rounded-full border px-2 py-px text-xs leading-5 md:px-2.5 md:text-[13px] ${active ? 'border-ok-line bg-ok-bg text-ok' : 'border-off-line bg-off-bg text-off'}`
      } ${className}`}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className="flex-none"
      >
        <circle cx="12" cy="12" r="9" />
        {active ? <path d="m8 12 3 3 5-6" /> : <path d="M5.6 18.4 18.4 5.6" />}
      </svg>
      {label}
    </span>
  );
}
