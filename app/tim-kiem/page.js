// Kết quả tìm /tim-kiem?q=...&tinh=...&trangthai=...&page=2 (spec mục 3.2). SSR, noindex.
import ListFilters from '@/components/ListFilters';
import Breadcrumb from '@/components/Breadcrumb';
import ListPageShell from '@/components/ListPageShell';
import SearchBox from '@/components/SearchBox';
import TrackOnMount from '@/components/TrackOnMount';
import { searchCompanies } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { M, STATUS_FILTER_OPTIONS } from '@/lib/messages';
import { provinceOptions } from '@/lib/provinces';
import { buildHref, firstParam, pageNumber } from '@/lib/url';

export const dynamic = 'force-dynamic';

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

  const { options, bySlug } = await provinceOptions();
  const province = bySlug(tinh);
  const status = STATUS_FILTER_OPTIONS.some((o) => o.value === trangthai) ? trangthai : '';
  const data = await searchCompanies({ q, province: province?.code, status, page });
  const queryType = /^\d[\d\s.-]*$/.test(q) ? 'mst' : 'text';

  return (
    <>
      <TrackOnMount name="search" params={{ query_type: queryType, result_count: data.total }} />
      <ListPageShell
        breadcrumb={[{ name: M.search.pageTitle }]}
        highlight={q}
        title={M.search.resultsFor(formatNumber(data.total), q)}
        totalLabel={false}
        filters={
          <ListFilters
            key={`${tinh}|${status}`}
            action="/tim-kiem"
            hidden={{ q }}
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
            ]}
          />
        }
        data={data}
        basePath="/tim-kiem"
        params={{ q, tinh: province?.slug, trangthai: status }}
        emptyTitle={M.search.emptyTitle}
        emptyHints={M.search.emptyHints}
        slotPrefix="search"
      />
    </>
  );
}
