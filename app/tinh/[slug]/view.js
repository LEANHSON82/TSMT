// DN theo tỉnh /tinh/{slug-tinh}?page= (spec mục 2, 3.5).
import { notFound } from 'next/navigation';
import ListPageShell from '@/components/ListPageShell';
import ScopedSearch from '@/components/ScopedSearch';
import { listCompanies } from '@/lib/api';
import { industryOptions } from '@/lib/industry';
import { provinceOptions } from '@/lib/provinces';
import { buildHref, pageNumber } from '@/lib/url';
import { M, STATUS_FILTER_OPTIONS } from '@/lib/messages';

async function load(params, searchParams) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { bySlug } = await provinceOptions();
  const province = bySlug(slug);
  if (!province) notFound();
  return { province, page: pageNumber(sp.page) };
}

export async function provinceListMetadata({ params, searchParams }) {
  const { province, page } = await load(params, searchParams);
  const suffix = M.common.pageSuffix(page);
  // Tỉnh chưa có DN nào: trang mỏng (soft-404) → không cho index, vẫn cho đi theo link (như ngành × tỉnh rỗng).
  const empty = !province.company_count;
  return {
    ...(empty ? { robots: { index: false, follow: true } } : {}),
    title: `${M.list.province.title(province.name)}${suffix}`,
    description: M.list.province.metaDescription(province.name, suffix),
    alternates: { canonical: buildHref(`/tinh/${province.slug}`, { page }) },
  };
}

export async function ProvinceList({ params, searchParams }) {
  const { province, page } = await load(params, searchParams);
  const [data, { options: industryOpts }] = await Promise.all([
    listCompanies({ province: province.code, sort: 'founded_desc', page }),
    industryOptions(),
  ]);
  return (
    <ListPageShell
      breadcrumb={[{ name: province.name }]}
      title={M.list.province.title(province.name)}
      description={M.list.province.lead(province.name)}
      // Tìm / lọc trong tỉnh → trang kết quả với tỉnh chọn sẵn (trang tỉnh giữ nguyên danh sách theo spec 3.5).
      intro={
        <ScopedSearch
          fixed={{ tinh: province.slug }}
          label={M.search.scopedLabel(`tại ${province.name}`)}
          scope={province.name}
          selects={[
            {
              name: 'nganh',
              label: M.search.industryFilter,
              allLabel: M.search.allIndustries,
              options: industryOpts,
            },
            {
              name: 'trangthai',
              label: M.list.statusFilter,
              allLabel: M.list.allStatuses,
              options: STATUS_FILTER_OPTIONS,
            },
          ]}
        />
      }
      data={data}
      basePath={`/tinh/${province.slug}`}
      params={{}}
      slotPrefix="province"
    />
  );
}
