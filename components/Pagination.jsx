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

export default function Pagination({ page, totalPages, basePath, params = {} }) {
  if (totalPages <= 1) return null;
  const href = (p) => buildHref(basePath, { ...params, page: p });
  const box =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-md border px-3 text-[15px] font-semibold tabular-nums no-underline';
  return (
    <nav aria-label={M.pagination.label} className="flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              aria-label={M.pagination.prev}
              rel="prev"
              className={`${box} border-line bg-white text-brand hover:border-brand`}
            >
              <IconChevronLeft size={20} />
            </Link>
          ) : (
            <span aria-hidden="true" className={`${box} border-line-soft bg-page text-field`}>
              <IconChevronLeft size={20} />
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
                <Link
                  href={href(p)}
                  aria-label={M.pagination.page(p)}
                  className={`${box} border-line bg-white text-brand hover:border-brand`}
                >
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link
              href={href(page + 1)}
              aria-label={M.pagination.next}
              rel="next"
              className={`${box} border-line bg-white text-brand hover:border-brand`}
            >
              <IconChevronRight size={20} />
            </Link>
          ) : (
            <span aria-hidden="true" className={`${box} border-line-soft bg-page text-field`}>
              <IconChevronRight size={20} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
