/** Nhãn mã ngành VSIC: một kiểu trung tính theo màu thương hiệu (không tô màu riêng từng nhóm ngành). */
export default function IndustryCode({ code, className = '' }) {
  return (
    <span
      className={`inline-flex h-[26px] w-[52px] flex-none items-center justify-center rounded bg-brand-50 text-meta font-semibold text-brand-hover tabular-nums ${className}`}
    >
      {code}
    </span>
  );
}
