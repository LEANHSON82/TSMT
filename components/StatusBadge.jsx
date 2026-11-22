import { STATUS_LABELS } from '@/lib/messages';

// Tình trạng DN (spec mục 3.3), kiểu Pappers: icon + chữ, không nền — xanh lá khi đang hoạt động (✓), xám khi
// ngừng / đóng MST (⊘). Màu và icon cùng báo trạng thái nên không phụ thuộc riêng vào màu (WCAG 1.4.1).
export default function StatusBadge({ status, className = '' }) {
  const code = status?.code || 'active';
  const label = status?.label || STATUS_LABELS[code] || code;
  const active = code === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm leading-5 font-semibold whitespace-nowrap ${active ? 'text-ok' : 'text-off'} ${className}`}
    >
      <svg
        width="15"
        height="15"
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
