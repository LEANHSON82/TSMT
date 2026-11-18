import Link from 'next/link';
import { M } from '@/lib/messages';
import { buildHref } from '@/lib/url';

// Lối vào bộ lọc nâng cao (/tim-kiem: nhiều tỉnh, nhiều ngành, thời gian thành lập, tình trạng).
// Trang tỉnh / ngành / DN mới giữ URL một giá trị như spec (Google lập chỉ mục, cache ISR) → bấm sang /tim-kiem
// (noindex) với sẵn tỉnh / ngành đang xem.
//   variant="card" (mặc định): khối có viền, tiêu đề đậm + mô tả + nút «Mở bộ lọc» — đủ nổi để người dùng thấy.
//   variant="inline": một dòng link có icon (dưới ô tìm trang chủ).
function FilterIcon({ size = 20, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export default function AdvancedFilterLink({ params = {}, variant = 'card' }) {
  const href = buildHref('/tim-kiem', params);
  if (variant === 'inline') {
    return (
      <Link
        href={href}
        prefetch={false}
        className="inline-flex min-h-11 items-center gap-2 text-body font-semibold no-underline"
      >
        <FilterIcon size={18} />
        {M.list.advancedFilterCta}
        <span aria-hidden="true">→</span>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      prefetch={false}
      className="group flex items-center gap-3 rounded-xl border border-brand/30 bg-white px-4 py-3 no-underline transition-colors hover:border-brand hover:bg-brand-50"
    >
      <FilterIcon size={22} className="flex-none text-brand" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body font-semibold text-navy">{M.list.advancedFilter}</span>
        <span className="text-sm text-ink-2">{M.list.advancedFilterHint}</span>
      </span>
      {/* Từ 640px: nút «Mở bộ lọc →». Điện thoại: cả khối đã bấm được → chỉ một mũi tên nhỏ, không nền. */}
      <span className="inline-flex h-10 flex-none items-center gap-1 rounded-md bg-brand px-4 text-sm font-semibold text-white group-hover:bg-brand-hover max-sm:hidden">
        {M.list.advancedFilterOpen}
        <span aria-hidden="true">→</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-none text-brand sm:hidden"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
