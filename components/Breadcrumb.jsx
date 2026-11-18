import Link from 'next/link';
import { M } from '@/lib/messages';
import { absoluteUrl } from '@/lib/site';
import JsonLd from './JsonLd';

/** items: [{ name, href? }] — phần tử cuối là trang hiện tại. Kèm BreadcrumbList JSON-LD (spec mục 7.1). */
export default function Breadcrumb({ items }) {
  const all = [{ name: M.nav.home, href: '/' }, ...items];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.href ? { item: absoluteUrl(it.href) } : {}),
    })),
  };
  return (
    <>
      <nav aria-label={M.nav.breadcrumb} className="min-w-0">
        {/* Luôn một dòng: mục cuối (tên DN dài) cắt bằng «…» — tên đầy đủ đã có ở H1 ngay dưới. */}
        <ol className="flex items-center gap-x-2 text-sm text-muted">
          {all.map((it, i) => {
            const last = i === all.length - 1;
            return (
              <li
                key={i}
                className={`flex items-center gap-2 ${last ? 'min-w-0 flex-1' : 'flex-none'}`}
              >
                {i > 0 && <span aria-hidden="true">›</span>}
                {last || !it.href ? (
                  <span aria-current={last ? 'page' : undefined} className="truncate text-ink-2">
                    {it.name}
                  </span>
                ) : (
                  <Link
                    href={it.href}
                    className="-my-1.5 inline-flex min-h-11 items-center no-underline"
                  >
                    {it.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={ld} />
    </>
  );
}
