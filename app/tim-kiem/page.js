// Kết quả tìm /tim-kiem?q=...&tinh=...&trangthai=...&page=2 (spec mục 3.2). SSR, noindex.
// Thêm (đề xuất mở rộng API, README): &theo=ten|dai-dien|so (tab «Tìm theo»), &sapxep=moi|cu (bỏ trống = phù hợp
// nhất), lọc nâng cao &tinh=ha-noi,ho-chi-minh (nhiều tỉnh), &nganh=6201,4330 (nhiều ngành), &thanhlap=30-ngay.
// Không có từ khoá: hiện sẵn danh sách DN (theo bộ lọc nếu có, không lọc = tất cả), mới thành lập trước.
// Từ khoá có tên tỉnh mà chưa lọc tỉnh → gợi ý «Lọc tại …».
import ListFilters from '@/components/ListFilters';
import ListPageShell from '@/components/ListPageShell';
import PeopleMatches from '@/components/PeopleMatches';
import QuerySync from '@/components/QuerySync';
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
import { toSlug } from '@/lib/slug';

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
  // Hai form: bộ lọc nâng cao (hàng ô chọn trên bảng) và «Sắp xếp» (bên phải hàng số đếm, như bản mẫu A).
  // Mỗi form giữ giá trị của form kia trong hidden → đổi bên nào cũng không mất bên kia.
  const { sapxep, ...filterParams } = params;
  const filterForm = (
    <ListFilters
      key={filterKey}
      action="/tim-kiem"
      hidden={{ q, theo: tab.value, sapxep }}
      fields={f.fields.filter((x) => x.name !== 'sapxep')}
    />
  );
  const sortForm = (
    <ListFilters
      key={`sort|${filterKey}`}
      variant="inline"
      action="/tim-kiem"
      hidden={filterParams}
      fields={f.fields.filter((x) => x.name === 'sapxep').map((x) => ({ ...x, inlineLabel: true }))}
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
  const bare = data.total === 0 && !hasFilter && !tab.value;
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

  // Đếm trước số kết quả của «Lọc tại …» (cùng API tìm kiếm): 0 kết quả thì không đưa người dùng vào ngõ cụt.
  const intentCount = intent?.rest
    ? await searchCompanies({ q: intent.rest, province: [intent.province.code] })
        .then((d) => d.total ?? null)
        .catch(() => null)
    : null;

  // 0 kết quả cho một từ khoá chữ: lối đi tiếp bấm được (bỏ bớt từng từ, tìm trong người đại diện, DN mới).
  const words = q.split(/\s+/).filter(Boolean);
  const emptyActions =
    data.total === 0 && q && !hasFilter
      ? [
          ...(words.length > 1
            ? words.slice(0, 3).map((_, i) => {
                const rest = words.filter((__, k) => k !== i).join(' ');
                return {
                  href: buildHref('/tim-kiem', { q: rest }),
                  label: M.search.tryQuery(rest),
                };
              })
            : []),
          ...(queryType === 'text' && tab.value !== 'dai-dien'
            ? [
                {
                  href: buildHref('/tim-kiem', { q, theo: 'dai-dien' }),
                  label: M.search.tryRepresentative(q),
                },
              ]
            : []),
          { href: '/doanh-nghiep-moi-thanh-lap', label: M.search.tryNew },
        ]
      : null;
  const digits = q.replace(/\D/g, '');
  const mstHint =
    data.total === 0 && /^[\d\s.-]+$/.test(q) && digits.length < 10
      ? M.search.mstTooShort(digits.length)
      : null;

  const intentBox =
    intent && intentCount !== 0 ? (
      <p className="flex flex-wrap items-center gap-x-3 rounded-sm bg-brand-50 px-4 py-0.5 text-body text-ink-2">
        {M.search.provinceIntent(intent.province.name)}
        <a href={intentHref} className="inline-flex min-h-11 items-center font-semibold">
          {M.search.provinceIntentAction(intent.province.name, intentCount ?? undefined)} →
        </a>
      </p>
    ) : null;

  return (
    <>
      {/* Back/Forward giữa hai URL /tim-kiem chỉ khác tham số: đảm bảo nội dung khớp URL (QuerySync.jsx). */}
      <QuerySync params={sp} />
      {/* Sự kiện search (spec mục 7.4) chỉ khi có từ khoá; chỉ dùng bộ lọc thì không phải lượt tìm. */}
      {q && (
        <TrackOnMount name="search" params={{ query_type: queryType, result_count: data.total }} />
      )}
      <ListPageShell
        // Tìm từ trang tỉnh / ngành (một tỉnh hoặc một ngành đang lọc): breadcrumb chỉ về trang đó để người dùng
        // biết mình vẫn đang tìm trong tỉnh / ngành ấy và quay lại được.
        breadcrumb={[
          ...(f.selProvinces.length === 1 && !f.selIndustries.length
            ? [{ name: f.selProvinces[0].name, href: `/tinh/${f.selProvinces[0].slug}` }]
            : []),
          ...(f.selIndustries.length === 1
            ? [
                {
                  name: M.list.industry.crumb(f.selIndustries[0].code),
                  href: `/nganh/${f.selIndustries[0].code}-${f.selIndustries[0].slug || toSlug(f.selIndustries[0].name)}`,
                },
              ]
            : []),
          { name: q || !f.hasFilter ? M.search.pageTitle : M.search.filterTitle },
        ]}
        highlight={q}
        title={
          !q && !f.hasFilter
            ? M.search.pageTitle
            : q
              ? M.search.resultsFor(formatNumber(data.total), q)
              : M.search.filterResults(formatNumber(data.total))
        }
        description={!q && !f.hasFilter ? M.search.noQuery : undefined}
        // Chưa gõ từ khoá: không có ô tìm lớn riêng — hàng ô tìm trên header luôn hiện ở trang này.
        // 0 kết quả mà chưa bật bộ lọc nào: tab và bộ lọc không giúp gì, ẩn để thông báo + gợi ý hiện ngay.
        intro={
          bare ? (
            intentBox
          ) : (
            <>
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
            </>
          )
        }
        filters={data.total ? sortForm : null}
        data={data}
        basePath="/tim-kiem"
        params={params}
        emptyTitle={M.search.emptyTitle}
        emptyHints={
          mstHint
            ? [mstHint]
            : !q
              ? M.search.emptyFilterHints
              : tab.value
                ? [M.search.emptyInField]
                : M.search.emptyHints
        }
        emptyActions={emptyActions}
        slotPrefix="search"
      />
    </>
  );
}
