import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import CompanyCard from '@/components/CompanyCard';
import ProvinceListToggle from '@/components/ProvinceListToggle';
import JsonLd from '@/components/JsonLd';
import SearchBox from '@/components/SearchBox';
import { IconChevronRight } from '@/components/Icons';
import { getProvinces, getStats, listCompanies } from '@/lib/api';
import DailyBars from '@/components/DailyBars';
import IndustryIcon from '@/components/IndustryIcon';
import { toSlug } from '@/lib/slug';
import { formatDateTime, formatNumber } from '@/lib/format';
import { companyPath } from '@/lib/mst';
import { buildHref } from '@/lib/url';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { M } from '@/lib/messages';

const SECTION_TITLE = 'min-w-0 text-xl leading-7 font-semibold text-navy md:text-2xl md:leading-8';

// ISR, làm mới 10 phút (spec mục 2).
export const revalidate = 600;

export const metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [latest, provinces, stats] = await Promise.all([
    listCompanies({ sort: 'founded_desc', page: 1 }).catch(() => ({ items: [] })),
    getProvinces().catch(() => []),
    getStats(),
  ]);
  const newest = (latest.items || []).slice(0, 20);
  const byCount = [...provinces].sort((a, b) => b.company_count - a.company_count);
  const total = stats?.total ?? provinces.reduce((sum, p) => sum + (p.company_count || 0), 0);
  const maxProv = Math.max(1, ...provinces.map((p) => p.company_count || 0));
  const topIndustries = stats?.top_industries || [];
  const maxInd = Math.max(1, ...topIndustries.map((i) => i.count));
  // Thời điểm trang được dựng lại (ISR 10 phút) — dữ liệu mới nhất mà trang đang hiện.
  const updatedAt = formatDateTime(new Date().toISOString());
  const examples = [
    ...(newest[0] ? [{ label: newest[0].mst, href: companyPath(newest[0]) }] : []),
    ...M.home.exampleQueries.map((q) => ({ label: q, href: buildHref('/tim-kiem', { q }) })),
  ];

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
      {/* Thứ tự theo spec 3.1: ô tìm → DN mới thành lập → ô quảng cáo → tra cứu theo tỉnh/thành. */}
      <main className="flex w-full flex-col">
        {/* Dải xanh thương hiệu: tiêu đề, ô tìm, số liệu thật (tổng DN, DN mới 7/30 ngày, biểu đồ 14 ngày). */}
        <section className="on-dark bg-navy text-white">
          <div className="mx-auto flex max-w-[808px] flex-col items-center gap-2 px-4 pt-7 pb-6 text-center md:gap-3 md:px-6 md:pt-14 md:pb-10">
            <h1
              id="home-title"
              className="text-2xl leading-8 font-semibold text-pretty text-white md:text-[34px] md:leading-[42px]"
            >
              {M.home.title}
            </h1>
            <p className="text-sm leading-[22px] text-white/80 md:text-base">{M.home.lead}</p>
            <div data-hero-search className="mt-3 w-full">
              <SearchBox size="lg" autoFocusDesktop />
            </div>
            {examples.length > 0 && (
              <p className="flex flex-wrap items-center justify-center gap-x-1 text-sm text-white/70">
                <span>{M.home.examples}</span>
                {examples.map((e) => (
                  <Link
                    key={e.label}
                    href={e.href}
                    prefetch={false}
                    className="inline-flex min-h-11 items-center px-1.5 font-semibold text-white tabular-nums underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  >
                    {e.label}
                  </Link>
                ))}
              </p>
            )}
          </div>
          <div className="border-t border-white/10 bg-white/[0.03]">
            <div className="mx-auto grid max-w-[1200px] gap-x-8 gap-y-5 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end">
              <dl className="grid grid-cols-3 gap-3 md:gap-8">
                {[
                  [M.home.statTotal, total],
                  ...(stats
                    ? [
                        [M.home.stat7d, stats.new_7d],
                        [M.home.stat30d, stats.new_30d],
                      ]
                    : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex min-w-0 flex-col-reverse gap-1">
                    <dt className="text-meta leading-5 text-white/70 md:text-sm">{label}</dt>
                    <dd className="text-2xl leading-8 font-semibold text-white tabular-nums md:text-[32px] md:leading-10">
                      {formatNumber(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              {stats?.daily && <DailyBars daily={stats.daily} />}
            </div>
            <p className="mx-auto max-w-[1200px] px-4 pb-4 text-xs text-white/60 md:px-6">
              {M.home.updated(updatedAt)} · {M.home.source}
            </p>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 pt-8 pb-10 md:gap-12 md:px-6 md:pt-10 md:pb-12">
          <section aria-labelledby="new-title" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="new-title" className={SECTION_TITLE}>
                {M.home.newTitle}
              </h2>
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
            {/* Một khung, các ô ngăn bằng đường kẻ mảnh: mỗi ô có viền phải + dưới, lưới lùi 1px để viền
              của cột/hàng cuối nấp dưới viền khung. Ô trống ở hàng cuối (nếu có) vẫn là nền trắng. */}
            <div className="overflow-hidden rounded-xl border border-line bg-white">
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

          <section aria-labelledby="prov-title" className="flex flex-col gap-4">
            <h2 id="prov-title" className={SECTION_TITLE}>
              {M.home.provincesTitle}
            </h2>
            {/* Dạng mục lục: tên tỉnh bên trái, số DN bên phải, nhiều DN xếp trước. Điện thoại: 8 tỉnh + nút xem tất cả. */}
            <ProvinceListToggle total={byCount.length}>
              <ul className="prov-list columns-2 gap-x-3 rounded-xl border border-line bg-white p-1.5 shadow-[0_1px_2px_rgba(10,42,94,0.05)] md:columns-3 md:gap-x-6 md:p-3 lg:columns-4">
                {byCount.map((p) => (
                  <li key={p.code} className="break-inside-avoid">
                    <Link
                      href={`/tinh/${p.slug}`}
                      prefetch={false}
                      className="flex min-h-12 min-w-0 flex-col justify-center gap-1 rounded-md px-2 py-1.5 text-ink no-underline hover:bg-page hover:text-brand md:px-3"
                    >
                      <span className="flex items-baseline justify-between gap-2 md:gap-3">
                        <span className="truncate text-body">{p.name}</span>
                        <span className="flex-none text-sm text-muted tabular-nums">
                          {formatNumber(p.company_count)}
                          <span className="sr-only">{M.home.companiesSr}</span>
                        </span>
                      </span>
                      {/* Thanh tỉ lệ số DN (so với tỉnh nhiều nhất) — số đã ghi bên cạnh nên thanh chỉ để nhìn. */}
                      <span aria-hidden="true" className="h-[3px] rounded-full bg-line-soft">
                        <span
                          className="block h-full rounded-full bg-brand/60"
                          style={{ width: `${(p.company_count / maxProv) * 100}%` }}
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </ProvinceListToggle>
          </section>

          {topIndustries.length > 0 && (
            <section aria-labelledby="ind-title" className="flex flex-col gap-4">
              <h2 id="ind-title" className={SECTION_TITLE}>
                {M.home.industriesTitle}
              </h2>
              <ul className="grid grid-cols-1 gap-x-6 rounded-xl border border-line bg-white p-1.5 shadow-[0_1px_2px_rgba(10,42,94,0.05)] md:grid-cols-2 md:p-3">
                {topIndustries.map((ind) => (
                  <li key={ind.code}>
                    <Link
                      href={`/nganh/${ind.code}-${ind.slug || toSlug(ind.name)}`}
                      prefetch={false}
                      className="flex min-h-12 items-center gap-3 rounded-md px-2 py-1.5 text-ink no-underline hover:bg-page hover:text-brand md:px-3"
                    >
                      <IndustryIcon code={ind.code} className="flex-none text-brand" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-body">
                            <span className="font-semibold tabular-nums">{ind.code}</span>{' '}
                            {ind.name}
                          </span>
                          <span className="flex-none text-sm text-muted tabular-nums">
                            {formatNumber(ind.count)}
                            <span className="sr-only">{M.home.companiesSr}</span>
                          </span>
                        </span>
                        <span aria-hidden="true" className="h-[3px] rounded-full bg-line-soft">
                          <span
                            className="block h-full rounded-full bg-brand/60"
                            style={{ width: `${(ind.count / maxInd) * 100}%` }}
                          />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
