import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
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
      <section className="relative border-b border-line bg-white">
        {/* Bản đồ Việt Nam dạng chấm (có Hoàng Sa, Trường Sa) — chỉ trang trí, chỉ hiện ở màn hình rộng
            (≥ 1280px) để không đè ô tìm. Tạo bằng scripts/gen-vn-dots.py. Kích thước cố định → không giật.
            Chỉ lớp bọc bản đồ có overflow-hidden — đặt lên section sẽ cắt mất danh sách gợi ý của ô tìm. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden overflow-hidden xl:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vn-dots.svg"
            alt=""
            width={263}
            height={312}
            decoding="async"
            fetchPriority="low"
            className="pointer-events-none absolute top-1/2 right-[max(24px,calc(50%-600px))] h-[232px] w-auto -translate-y-1/2 select-none"
          />
        </div>
        <div className="relative mx-auto flex max-w-[808px] flex-col items-center gap-2 px-4 pt-6 pb-6 text-center md:gap-3 md:px-6 md:pt-14 md:pb-[52px]">
          <h1
            id="home-title"
            className="text-[22px] leading-7 font-semibold text-navy md:text-[30px] md:leading-[38px]"
          >
            {M.home.title}
          </h1>
          <p className="text-sm leading-[22px] text-ink-2 md:text-base">{M.home.lead}</p>
          <div data-hero-search className="mt-3 w-full">
            <SearchBox size="lg" autoFocusDesktop />
          </div>
        </div>
      </section>

      {/* Nền phân lớp: hero trắng · khối DN mới nền xám · khối tỉnh/thành dải xanh rất nhạt · footer trắng. */}
      <main className="flex w-full flex-col">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pt-8 pb-12 md:gap-12 md:px-6 md:pt-10 md:pb-14">
          <section aria-labelledby="new-title" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <h2
                  id="new-title"
                  className="min-w-0 text-[17px] leading-7 font-semibold text-navy md:text-2xl md:leading-8"
                >
                  {M.home.newTitle}
                </h2>
              </div>
              <Link
                href="/doanh-nghiep-moi-thanh-lap"
                className="group inline-flex min-h-11 flex-none items-center gap-1 text-sm font-semibold whitespace-nowrap no-underline md:text-[15px]"
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
            {/* Một khung, các ô ngăn bằng đường kẻ mảnh: mỗi ô có viền phải + dưới, lưới lùi 1px để viền
              của cột/hàng cuối nấp dưới viền khung. Ô trống ở hàng cuối (nếu có) vẫn là nền trắng. */}
            {/* .reveal đặt trên cả khung, KHÔNG đặt trên từng ô: ô có transform thành lớp vẽ riêng, ô bắt đầu
                ở toạ độ lẻ (vd. x = 640,5) mất đường kẻ 1px. */}
            <div className="reveal overflow-hidden rounded-xl border border-line bg-white">
              <ul className="-mr-px -mb-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {newest.map((c) => (
                  <li key={c.mst} className="border-r border-b border-line">
                    <CompanyCard company={c} variant="cell" showNew={false} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <AdSlot slotId="home-mid" />
        </div>

        <section aria-labelledby="prov-title" className="border-t border-line bg-brand-50/70">
          <div className="reveal mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-10 md:px-6 md:py-14">
            <div className="flex flex-col gap-0.5">
              <h2
                id="prov-title"
                className="min-w-0 text-[17px] leading-7 font-semibold text-navy md:text-2xl md:leading-8"
              >
                {M.home.provincesTitle}
              </h2>
            </div>
            {/* Dạng mục lục: tên tỉnh bên trái, số DN bên phải, chia cột theo chiều dọc. */}
            {/* Bản đồ (≥ 1024px): rê chuột / focus tên tỉnh → chấm tỉnh đó sáng lên (CSS .prov-map-scope, không JS). */}
            <div className="prov-map-scope grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
              <VnDotMap showAll className="hidden w-[240px] lg:block" />
              <ul className="columns-2 gap-x-6 rounded-xl border border-line bg-white p-2 md:columns-3 md:p-3">
                {byCount.map((p) => (
                  <li key={p.code} className="break-inside-avoid">
                    <Link
                      href={`/tinh/${p.slug}`}
                      data-prov={p.code}
                      className="flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-md px-2.5 text-ink no-underline hover:bg-page hover:text-brand md:px-3"
                    >
                      <span className="truncate text-[15px]">{p.name}</span>
                      <span className="flex-none text-sm text-muted tabular-nums">
                        {formatNumber(p.company_count)}
                        <span className="sr-only"> doanh nghiệp</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
