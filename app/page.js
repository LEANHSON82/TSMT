import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import AdvancedFilterLink from '@/components/AdvancedFilterLink';
import CompanyCard from '@/components/CompanyCard';
import VnDotMap from '@/components/VnDotMap';
import JsonLd from '@/components/JsonLd';
import SearchBox from '@/components/SearchBox';
import { IconChevronRight } from '@/components/Icons';
import { getProvinces, listCompanies } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { M } from '@/lib/messages';

// ISR, làm mới 10 phút (spec mục 2).
export const revalidate = 600;

export const metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [latest, provinces] = await Promise.all([
    listCompanies({ sort: 'founded_desc', page: 1 }).catch(() => ({ items: [] })),
    getProvinces().catch(() => []),
  ]);
  const newest = (latest.items || []).slice(0, 20);
  const byCount = [...provinces].sort((a, b) => b.company_count - a.company_count);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: absoluteUrl('/'),
          potentialAction: {
            '@type': 'SearchAction',
            target: `${absoluteUrl('/tim-kiem')}?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      {/* Mọi trang có BreadcrumbList (spec mục 7.1); trang chủ chỉ có một mục. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: M.nav.home, item: absoluteUrl('/') },
          ],
        }}
      />
      {/* Thứ tự theo yêu cầu: tỉnh/thành (dải xanh nhạt) → ô quảng cáo → DN mới thành lập. Spec 3.1 liệt kê
          DN mới (mục 4) trước tỉnh/thành (mục 5); ô quảng cáo vẫn nằm giữa hai khối (mục 6). */}
      <main className="flex w-full flex-col">
        <section className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-[808px] flex-col items-center gap-2 px-4 pt-6 pb-6 text-center md:gap-3 md:px-6 md:pt-14 md:pb-[52px]">
            <h1
              id="home-title"
              className="text-2xl leading-8 font-semibold text-pretty text-navy md:text-3xl md:leading-[38px]"
            >
              {M.home.title}
            </h1>
            <p className="text-sm leading-[22px] text-ink-2 md:text-base">{M.home.lead}</p>
            <div data-hero-search className="mt-3 w-full">
              <SearchBox size="lg" autoFocusDesktop />
            </div>
            <AdvancedFilterLink variant="inline" />
          </div>
        </section>

        <section aria-labelledby="prov-title" className="border-b border-line bg-brand-50/70">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-8 md:px-6 md:py-12">
            <div className="flex flex-col gap-0.5">
              <h2
                id="prov-title"
                className="min-w-0 text-xl leading-7 font-semibold text-navy md:text-2xl md:leading-8"
              >
                {M.home.provincesTitle}
              </h2>
            </div>
            {/* Dạng mục lục: tên tỉnh bên trái, số DN bên phải, chia cột theo chiều dọc. */}
            {/* Bản đồ (≥ 1024px): rê chuột / focus tên tỉnh → chấm tỉnh đó sáng lên (CSS .prov-map-scope, không JS). */}
            <div className="prov-map-scope grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
              <VnDotMap showAll className="hidden w-[240px] lg:block" />
              <ul className="columns-2 gap-x-3 rounded-xl border border-line bg-white p-1.5 md:columns-3 md:gap-x-6 md:p-3">
                {byCount.map((p) => (
                  <li key={p.code} className="break-inside-avoid">
                    <Link
                      href={`/tinh/${p.slug}`}
                      prefetch={false}
                      data-prov={p.code}
                      className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-md px-2 text-ink no-underline hover:bg-page hover:text-brand md:gap-3 md:px-3"
                    >
                      <span className="truncate text-body">{p.name}</span>
                      <span className="flex-none text-sm text-muted tabular-nums">
                        {formatNumber(p.company_count)}
                        <span className="sr-only">{M.home.companiesSr}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pt-8 pb-12 md:gap-12 md:px-6 md:pt-10 md:pb-14">
          <AdSlot slotId="home-mid" />

          <section aria-labelledby="new-title" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <h2
                  id="new-title"
                  className="min-w-0 text-xl leading-7 font-semibold text-navy md:text-2xl md:leading-8"
                >
                  {M.home.newTitle}
                </h2>
              </div>
              <Link
                href="/doanh-nghiep-moi-thanh-lap"
                className="press group inline-flex min-h-11 flex-none items-center gap-1 text-sm font-semibold whitespace-nowrap no-underline md:text-body"
              >
                {/* Màn hình rất hẹp (≤ 380px): rút gọn để tiêu đề khối vẫn nằm một dòng. */}
                <span className="min-[381px]:hidden">{M.home.viewAllShort}</span>
                <span className="max-[380px]:hidden">{M.home.viewAll}</span>
                <IconChevronRight
                  size={18}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
            {/* Mỗi DN một thẻ riêng, cách nhau 16px. 20 DN (spec 3.1): máy tính 4 cột, tablet 2 cột → hàng nào cũng
                đầy (20 chia hết); 5 cột thì thẻ quá hẹp, tên DN xuống 3 dòng. */}
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {newest.map((c) => (
                <li key={c.mst}>
                  <CompanyCard company={c} showNew={false} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
