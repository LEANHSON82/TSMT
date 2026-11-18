import Link from 'next/link';
import { M } from '@/lib/messages';
import { buildHref } from '@/lib/url';

// Trang tỉnh / ngành / DN mới giữ URL một giá trị như spec (Google lập chỉ mục, cache ISR). Lọc nhiều tỉnh, nhiều
// ngành, thời gian thành lập → sang /tim-kiem (noindex) với sẵn tỉnh / ngành đang xem.
export default function AdvancedFilterLink({ params = {} }) {
  return (
    <Link
      href={buildHref('/tim-kiem', params)}
      prefetch={false}
      className="inline-flex min-h-11 items-center gap-2 self-start text-body font-semibold no-underline"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M4 6h16M7 12h10M10 18h4" />
      </svg>
      <span>
        {M.list.advancedFilter}
        <span className="font-normal text-ink-2">: {M.list.advancedFilterHint}</span>
      </span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}
