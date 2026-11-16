import { industryColor } from '@/lib/vsic';

/** Nhãn mã ngành VSIC, màu theo nhóm ngành cấp 1 (A–U). */
export default function IndustryCode({ code, className = '' }) {
  const { bg, fg } = industryColor(code);
  return (
    <span
      className={`inline-flex h-[26px] w-[52px] flex-none items-center justify-center rounded text-[13px] font-semibold tabular-nums ${className}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {code}
    </span>
  );
}
