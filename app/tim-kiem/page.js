// Kết quả tìm /tim-kiem?q=...&tinh=...&trangthai=...&page=2 (spec mục 3.2). SSR, noindex.
// Thêm (đề xuất mở rộng API, README): &theo=ten|dai-dien|so (tab «Tìm theo»), &sapxep=moi|cu (bỏ trống = phù hợp
// nhất), lọc nâng cao &tinh=ha-noi,ho-chi-minh (nhiều tỉnh), &nganh=6201,4330 (nhiều ngành), &thanhlap=30-ngay.
// Không có từ khoá: hiện sẵn danh sách DN (theo bộ lọc nếu có, không lọc = tất cả), mới thành lập trước.
// Từ khoá có tên tỉnh mà chưa lọc tỉnh → gợi ý «Lọc tại …».
import ListFilters from '@/components/ListFilters';
import ListPageShell from '@/components/ListPageShell';
import SearchBox from '@/components/SearchBox';
import PeopleMatches from '@/components/PeopleMatches';
import SearchFieldTabs, { FIELD_TABS } from '@/components/SearchFieldTabs';
import TrackOnMount from '@/components/TrackOnMount';
import { searchCompanies } from '@/lib/api';
import { FOUNDED_WITHIN, MAX_MULTI, foundedFrom, foundedOption, listParam } from '@/lib/filters';
import { formatNumber } from '@/lib/format';
import { industryOptions } from '@/lib/industry';
import { M, STATUS_FILTER_OPTIONS } from '@/lib/messages';
import { provinceOptions } from '@/lib/provinces';
import { findProvinceInQuery } from '@/lib/search-intent';
import { searchQueryType } from '@/lib/mst';
import { buildHref, firstParam, pageNumber } from '@/lib/url';

export const dynamic = 'force-dynamic';

// sapxep (URL) → sort (API)
const SORTS = { moi: 'founded_desc', cu: 'founded_asc' };

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const q = firstParam(sp.q).trim();
  return {
    title: q
      ? M.search.resultsTitle(q)
      : ['tinh', 'nganh', 'thanhlap', 'trangthai'].some((k) => firstParam(sp[k]))
        ? M.search.filterTitle
        : M.search.pageTitle,
    robots: { index: false, follow: true },
    alternates: { canonical: buildHref('/tim-kiem', { q, page: pageNumber(sp.page) }) },
  };
}

/** Đọc bộ lọc từ URL; bỏ giá trị không hợp lệ (tỉnh / ngành không có, quá nhiều lựa chọn). */
async function readFilters(sp, q) {
  const [{ provinces, options: provinceOpts, bySlug }, { options: industryOpts, byCode }] =
    await Promise.all([provinceOptions(), industryOptions()]);
  const selProvinces = listParam(sp.tinh).map(bySlug).filter(Boolean).slice(0, MAX_MULTI);
  const selIndustries = listParam(sp.nganh).map(byCode).filter(Boolean).slice(0, MAX_MULTI);
  const founded = foundedOption(firstParam(sp.thanhlap));
  const trangthai = firstParam(sp.trangthai);
  const status = STATUS_FILTER_OPTIONS.some((o) => o.value === trangthai) ? trangthai : '';
  const tab = (q && FIELD_TABS.find((t) => t.value === firstParam(sp.theo))) || FIELD_TABS[0];
  const sapxep = SORTS[firstParam(sp.sapxep)] ? firstParam(sp.sapxep) : '';
  // Không từ khoá: không có «phù hợp nhất» → mặc định mới thành lập trước («moi» trùng mặc định nên bỏ).
  const sort = q ? sapxep : sapxep === 'cu' ? 'cu' : '';

  const fields = [
    {
      name: 'tinh',
      multiple: true,
      label: M.list.provinceFilter,
      value: selProvinces.map((p) => p.slug),
      allLabel: M.list.allProvinces,
      searchLabel: M.search.searchProvince,
      options: provinceOpts,
    },
    {
      name: 'nganh',
      multiple: true,
      label: M.search.industryFilter,
      value: selIndustries.map((i) => i.code),
      allLabel: M.search.allIndustries,
      searchLabel: M.search.searchIndustry,
      options: industryOpts,
    },
    {
      name: 'thanhlap',
      label: M.search.foundedFilter,
      value: founded?.value || '',
      allLabel: M.search.foundedAll,
      options: FOUNDED_WITHIN.map((o) => ({
        value: o.value,
        label: M.search.founded[o.value],
        chip: M.search.foundedChip(M.search.founded[o.value]),
      })),
    },
    {
      name: 'trangthai',
      label: M.list.statusFilter,
      value: status,
      allLabel: M.list.allStatuses,
      options: STATUS_FILTER_OPTIONS,
    },
    {
      name: 'sapxep',
      label: M.search.sortLabel,
      value: sort,
      allLabel: q ? M.search.sortRelevance : M.search.sortNewest,
      filter: false,
      options: q
        ? [
            { value: 'moi', label: M.search.sortNewest },
            { value: 'cu', label: M.search.sortOldest },
          ]
        : [{ value: 'cu', label: M.search.sortOldest }],
    },
  ];

  return {
    provinces,
    selProvinces,
    selIndustries,
    founded,
    status,
    tab,
    sort,
    fields,
    hasFilter: Boolean(selProvinces.length || selIndustries.length || founded || status),
    params: {
      q,
      tinh: selProvinces.map((p) => p.slug).join(','),
      nganh: selIndustries.map((i) => i.code).join(','),
      thanhlap: founded?.value,
      trangthai: status,
      sapxep: sort,
      theo: tab.value,
    },
  };
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const q = firstParam(sp.q).trim();
  const page = pageNumber(sp.page);
  const f = await readFilters(sp, q);
  const { params, tab } = f;
  const filterKey = Object.values(params).join('|');
  const filterForm = (
    <ListFilters
      key={filterKey}
      action="/tim-kiem"
      hidden={{ q, theo: tab.value }}
      fields={f.fields}
    />
  );

  const data = await searchCompanies({
    q,
    province: f.selProvinces.map((p) => p.code),
    status: f.status,
    industry: f.selIndustries.map((i) => i.code),
    foundedFrom: foundedFrom(f.founded?.value),
    field: tab.field,
    sort: SORTS[f.sort] || (q ? undefined : 'founded_desc'),
    page,
  });
  const queryType = q ? searchQueryType(q) : '';
  // «xây dựng hà nội» → gợi ý lọc tại Hà Nội với từ khoá «xây dựng» (chỉ có tên tỉnh → sang trang tỉnh).
  const intent =
    q && !f.selProvinces.length && queryType === 'text'
      ? findProvinceInQuery(q, f.provinces)
      : null;
  const hasFilter = f.hasFilter;
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

  const intentBox = intent ? (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-brand/20 bg-brand-50 px-4 py-2 text-body text-ink-2">
      {M.search.provinceIntent(intent.province.name)}
      <a href={intentHref} className="inline-flex min-h-11 items-center font-semibold">
        {M.search.provinceIntentAction(intent.province.name)} →
      </a>
    </p>
  ) : null;

  return (
    <>
      {/* Sự kiện search (spec mục 7.4) chỉ khi có từ khoá; chỉ dùng bộ lọc thì không phải lượt tìm. */}
      {q && (
        <TrackOnMount name="search" params={{ query_type: queryType, result_count: data.total }} />
      )}
      <ListPageShell
        breadcrumb={[{ name: q || !f.hasFilter ? M.search.pageTitle : M.search.filterTitle }]}
        highlight={q}
        title={
          !q && !f.hasFilter
            ? M.search.pageTitle
            : q
              ? M.search.resultsFor(formatNumber(data.total), q)
              : M.search.filterResults(formatNumber(data.total))
        }
        description={!q && !f.hasFilter ? M.search.noQuery : undefined}
        totalLabel={!q && !f.hasFilter ? undefined : false}
        filters={
          // 0 kết quả mà chưa bật bộ lọc nào: tab và bộ lọc không giúp gì, ẩn để thông báo + gợi ý hiện ngay.
          data.total === 0 && !hasFilter && !tab.value ? (
            intentBox
          ) : (
            <div className="flex flex-col gap-4">
              {/* Chưa gõ từ khoá (đang duyệt / lọc): ô tìm lớn ngay trên bộ lọc. data-hero-search: ô tìm trên
                  header ẩn đi khi ô này còn trong màn hình (tránh 2 ô tìm). */}
              {!q && (
                <div data-hero-search className="max-w-[760px]">
                  <SearchBox size="lg" autoFocusDesktop />
                </div>
              )}
              {intentBox}
              {q && (
                <SearchFieldTabs
                  active={tab.value}
                  counts={data.counts}
                  hrefFor={(theo) => buildHref('/tim-kiem', { ...params, theo, page: undefined })}
                />
              )}
              {filterForm}
              <PeopleMatches people={data.people} q={q} tab={tab.value} params={params} />
            </div>
          )
        }
        data={data}
        basePath="/tim-kiem"
        params={params}
        emptyTitle={M.search.emptyTitle}
        emptyHints={
          !q ? M.search.emptyFilterHints : tab.value ? [M.search.emptyInField] : M.search.emptyHints
        }
        slotPrefix="search"
      />
    </>
  );
}
