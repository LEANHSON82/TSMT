// Kết quả tìm /tim-kiem?q=...&tinh=...&trangthai=...&page=2 (spec mục 3.2). SSR, noindex.
// Thêm (đề xuất mở rộng API, README): &theo=ten|dai-dien|so (tab «Tìm theo»), &nganh=mã ngành,
// &sapxep=moi|cu (bỏ trống = phù hợp nhất). Từ khoá có tên tỉnh mà chưa lọc tỉnh → gợi ý «Lọc tại …».
import ListFilters from '@/components/ListFilters';
import Breadcrumb from '@/components/Breadcrumb';
import ListPageShell from '@/components/ListPageShell';
import SearchBox from '@/components/SearchBox';
import SearchFieldTabs, { FIELD_TABS } from '@/components/SearchFieldTabs';
import TrackOnMount from '@/components/TrackOnMount';
import { searchCompanies } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { M, STATUS_FILTER_OPTIONS } from '@/lib/messages';
import { POPULAR_INDUSTRIES } from '@/lib/popular-industries';
import { provinceOptions } from '@/lib/provinces';
import { findProvinceInQuery } from '@/lib/search-intent';
import { buildHref, firstParam, pageNumber } from '@/lib/url';

export const dynamic = 'force-dynamic';

// sapxep (URL) → sort (API)
const SORTS = { moi: 'founded_desc', cu: 'founded_asc' };

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const q = firstParam(sp.q).trim();
  return {
    title: q ? M.search.resultsTitle(q) : M.search.pageTitle,
    robots: { index: false, follow: true },
    alternates: { canonical: buildHref('/tim-kiem', { q, page: pageNumber(sp.page) }) },
  };
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const q = firstParam(sp.q).trim();
  const tinh = firstParam(sp.tinh);
  const trangthai = firstParam(sp.trangthai);
  const page = pageNumber(sp.page);
  const tab = FIELD_TABS.find((t) => t.value === firstParam(sp.theo)) || FIELD_TABS[0];
  const industry = POPULAR_INDUSTRIES.find((i) => i.code === firstParam(sp.nganh));
  const sapxep = SORTS[firstParam(sp.sapxep)] ? firstParam(sp.sapxep) : '';

  if (!q) {
    return (
      <main className="mx-auto flex w-full max-w-[808px] flex-col gap-4 px-4 py-10 md:px-6">
        <Breadcrumb items={[{ name: M.search.pageTitle }]} />
        <h1 className="text-2xl font-semibold text-navy">{M.search.pageTitle}</h1>
        <p className="text-ink-2">{M.search.noQuery}</p>
        <div data-hero-search>
          <SearchBox size="lg" autoFocusDesktop />
        </div>
      </main>
    );
  }

  const { provinces, options, bySlug } = await provinceOptions();
  const province = bySlug(tinh);
  const status = STATUS_FILTER_OPTIONS.some((o) => o.value === trangthai) ? trangthai : '';
  const data = await searchCompanies({
    q,
    province: province?.code,
    status,
    industry: industry?.code,
    field: tab.field,
    sort: SORTS[sapxep],
    page,
  });
  const queryType = /^\d[\d\s.-]*$/.test(q) ? 'mst' : 'text';
  const params = {
    q,
    tinh: province?.slug,
    trangthai: status,
    nganh: industry?.code,
    sapxep,
    theo: tab.value,
  };
  // «xây dựng hà nội» → gợi ý lọc tại Hà Nội với từ khoá «xây dựng» (chỉ có tên tỉnh → sang trang tỉnh).
  const intent = !province && queryType === 'text' ? findProvinceInQuery(q, provinces) : null;
  const intentHref = intent
    ? intent.rest
      ? buildHref('/tim-kiem', {
          ...params,
          q: intent.rest,
          tinh: intent.province.slug,
          page: undefined,
        })
      : `/tinh/${intent.province.slug}`
    : null;

  return (
    <>
      <TrackOnMount name="search" params={{ query_type: queryType, result_count: data.total }} />
      <ListPageShell
        breadcrumb={[{ name: M.search.pageTitle }]}
        highlight={q}
        title={M.search.resultsFor(formatNumber(data.total), q)}
        totalLabel={false}
        filters={
          <div className="flex flex-col gap-4">
            {intent && (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-brand/20 bg-brand-50 px-4 py-2 text-[15px] text-ink-2">
                {M.search.provinceIntent(intent.province.name)}
                <a href={intentHref} className="inline-flex min-h-11 items-center font-semibold">
                  {M.search.provinceIntentAction(intent.province.name)} →
                </a>
              </p>
            )}
            <SearchFieldTabs
              active={tab.value}
              counts={data.counts}
              hrefFor={(theo) => buildHref('/tim-kiem', { ...params, theo, page: undefined })}
            />
            <ListFilters
              key={`${tinh}|${status}|${industry?.code || ''}|${sapxep}`}
              action="/tim-kiem"
              hidden={{ q, theo: tab.value }}
              fields={[
                {
                  name: 'tinh',
                  label: M.list.provinceFilter,
                  value: province?.slug || '',
                  allLabel: M.list.allProvinces,
                  options,
                },
                {
                  name: 'trangthai',
                  label: M.list.statusFilter,
                  value: status,
                  allLabel: M.list.allStatuses,
                  options: STATUS_FILTER_OPTIONS,
                },
                {
                  name: 'nganh',
                  label: M.search.industryFilter,
                  value: industry?.code || '',
                  allLabel: M.search.allIndustries,
                  options: POPULAR_INDUSTRIES.map((i) => ({
                    value: i.code,
                    label: `${i.code} – ${i.name}`,
                  })),
                },
                {
                  name: 'sapxep',
                  label: M.search.sortLabel,
                  value: sapxep,
                  allLabel: M.search.sortRelevance,
                  filter: false,
                  options: [
                    { value: 'moi', label: M.search.sortNewest },
                    { value: 'cu', label: M.search.sortOldest },
                  ],
                },
              ]}
            />
          </div>
        }
        data={data}
        basePath="/tim-kiem"
        params={params}
        emptyTitle={M.search.emptyTitle}
        emptyHints={tab.value ? [M.search.emptyInField] : M.search.emptyHints}
        slotPrefix="search"
      />
    </>
  );
}
