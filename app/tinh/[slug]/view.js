// DN theo tỉnh /tinh/{slug-tinh}?page= (spec mục 2, 3.5).
import { notFound } from 'next/navigation';
import AdvancedFilterLink from '@/components/AdvancedFilterLink';
import ListPageShell from '@/components/ListPageShell';
import VnDotMap from '@/components/VnDotMap';
import { listCompanies } from '@/lib/api';
import { provinceOptions } from '@/lib/provinces';
import { buildHref, pageNumber } from '@/lib/url';
import { M } from '@/lib/messages';

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
  return {
    title: `${M.list.province.title(province.name)}${suffix}`,
    description: M.list.province.metaDescription(province.name, suffix),
    alternates: { canonical: buildHref(`/tinh/${province.slug}`, { page }) },
  };
}

export async function ProvinceList({ params, searchParams }) {
  const { province, page } = await load(params, searchParams);
  const data = await listCompanies({ province: province.code, sort: 'founded_desc', page });
  return (
    <ListPageShell
      breadcrumb={[{ name: province.name }]}
      title={M.list.province.title(province.name)}
      description={M.list.province.lead(province.name)}
      filters={<AdvancedFilterLink params={{ tinh: province.slug }} />}
      data={data}
      basePath={`/tinh/${province.slug}`}
      params={{}}
      slotPrefix="province"
      showProvince={false}
      aside={<VnDotMap highlight={province.code} className="w-[130px]" />}
    />
  );
}
