import { STATUS_LABELS } from '@/lib/messages';

// Tình trạng DN (spec mục 3.3), hệ A: nhãn chữ nhật bo 2px, không chấm — xanh lá khi đang hoạt động, xám khi
// ngừng / đóng MST (class .tag trong globals.css: 13px, đậm, cao 20px — nhỏ hơn chữ phụ 14px để nhãn không lấn tên DN).
export default function StatusBadge({ status, className = '' }) {
  const code = status?.code || 'active';
  const label = status?.label || STATUS_LABELS[code] || code;
  const tone = code === 'active' ? 'tag-ok' : 'tag-off';
  return <span className={`tag ${tone} ${className}`}>{label}</span>;
}
