import { STATUS_LABELS } from '@/lib/messages';

// Tình trạng DN (spec mục 3.3): chữ thường, xanh khi đang hoạt động, xám khi ngừng/đóng MST.
export default function StatusBadge({ status, className = '' }) {
  const code = status?.code || 'active';
  const label = status?.label || STATUS_LABELS[code] || code;
  const tone = code === 'active' ? 'text-ok' : 'text-off';
  return <span className={`whitespace-nowrap ${tone} ${className}`}>{label}</span>;
}
