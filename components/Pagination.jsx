import Link from 'next/link';
import { M } from '@/lib/messages';
import { buildHref } from '@/lib/url';
import { IconChevronLeft, IconChevronRight } from './Icons';

/** Phân trang bằng số trang (spec mục 3.2), link <a href> thật để Google đi theo được. */
function pageList(page, total) {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

// Hệ A: «‹ Trước · 1 2 3 · Sau ›» bên trái, «Trang 1 / 2» bên phải. Ô vuông viền mảnh 44×44 (vùng bấm
// ≥ 44px, spec 7.3), trang hiện tại nền xanh. Điện thoại: «Trước/Sau» chỉ còn mũi tên, ẩn bớt số trang xa,
// «Trang x / y» xuống dòng dưới.
const box =
  'press inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg border px-3 text-body font-semibold tabular-nums no-underline';
const live = `${box} border-line-strong bg-white text-brand hover:border-brand hover:text-brand`;
const off = `${box} border-line text-[#7d7d7d]`;

export default function Pagination({ page, totalPages, basePath, params = {} }) {
  if (totalPages <= 1) return null;
  const href = (p) => buildHref(basePath, { ...params, page: p });
  const prev = (
    <>
      <IconChevronLeft size={16} strokeWidth={1.8} />
      <span className="max-sm:hidden">{M.pagination.prevShort}</span>
    </>
  );
  const next = (
    <>
      <span className="max-sm:hidden">{M.pagination.nextShort}</span>
      <IconChevronRight size={16} strokeWidth={1.8} />
    </>
  );
  return (
    <nav
      aria-label={M.pagination.label}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-6"
    >
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} aria-label={M.pagination.prev} rel="prev" className={live}>
              {prev}
            </Link>
          ) : (
            <span aria-hidden="true" className={off}>
              {prev}
            </span>
          )}
        </li>
        {pageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <li key={`e${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li
              key={p}
              className={
                Math.abs(p - page) > 1 && p !== 1 && p !== totalPages ? 'hidden sm:block' : ''
              }
            >
              {p === page ? (
                <span aria-current="page" className={`${box} border-brand bg-brand text-white`}>
                  <span className="sr-only">{M.pagination.page('')}</span>
                  {p}
                </span>
              ) : (
                <Link href={href(p)} aria-label={M.pagination.page(p)} className={live}>
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link href={href(page + 1)} aria-label={M.pagination.next} rel="next" className={live}>
              {next}
            </Link>
          ) : (
            <span aria-hidden="true" className={off}>
              {next}
            </span>
          )}
        </li>
      </ul>
      <p className="text-sm text-muted tabular-nums max-sm:w-full sm:ml-auto">
        {M.pagination.of(page, totalPages)}
      </p>
    </nav>
  );
}
