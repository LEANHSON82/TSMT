import { STATUS_LABELS } from '@/lib/messages';

// Tình trạng DN (spec mục 3.3), kiểu BizLookup: nhãn tròn viền mảnh — xanh lá (xanh ngọc) khi đang hoạt động (✓),
// xám khi ngừng / đóng MST (⊘). Chữ + icon cùng báo trạng thái nên không phụ thuộc riêng vào màu (WCAG 1.4.1).
// plain: chỉ icon + chữ màu (không nền / viền) — dùng trong bảng danh sách để 20 nhãn liền nhau không thành một cột
// khối xanh gây nhiễu. Vẫn xanh lá (đang hoạt động) / xám (ngừng, đóng) theo spec 3.3.
export default function StatusBadge({ status, plain = false, className = '' }) {
  const code = status?.code || 'active';
  const label = status?.label || STATUS_LABELS[code] || code;
  const active = code === 'active';
  // Chấm tròn + chữ màu (không khung, không viền): xanh lá = đang hoạt động, xám = ngừng / đóng MST. Chữ luôn kèm
  // theo nên không chỉ dựa vào màu (WCAG 1.4.1).
  return (
    <span
      className={`inline-flex items-center font-semibold whitespace-nowrap ${
        plain
          ? `gap-1.5 text-sm leading-5 ${active ? 'text-ok' : 'text-off'}`
          : `rounded-full px-2.5 py-0.5 text-[13px] leading-5 ${active ? 'bg-[#dcfce7] text-[#166534]' : 'bg-off-bg text-off'}`
      } ${className}`}
    >
      {/* Danh sách: chấm + chữ. Đầu trang DN: nhãn nền xanh lá nhạt (không chấm). */}
      {plain && <span aria-hidden="true" className="h-2 w-2 flex-none rounded-full bg-current" />}
      {label}
    </span>
  );
}
