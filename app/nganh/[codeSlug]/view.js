// DN theo ngành /nganh/{ma-nganh}-{slug}?tinh=&page= (spec mục 2, 3.5). Mã ngành VSIC 4 số.
import { notFound } from 'next/navigation';
import ListFilters from '@/components/ListFilters';
import ListPageShell from '@/components/ListPageShell';
import { IllusIndustry } from '@/components/Illustrations';
import { industryColor } from '@/lib/vsic';
import { listCompanies } from '@/lib/api';
import { resolveIndustry } from '@/lib/industry';
import { M } from '@/lib/messages';
import { provinceOptions } from '@/lib/provinces';
import { buildHref, firstParam, pageNumber } from '@/lib/url';

async function load(params, searchParams) {
  const [{ codeSlug }, sp] = await Promise.all([params, searchParams]);
  const r = await resolveIndustry(codeSlug);
  if (!r) notFound();
  const { options, bySlug } = await provinceOptions();
  const province = bySlug(firstParam(sp.tinh));
  return { ...r, province, options, page: pageNumber(sp.page) };
}

export async function industryListMetadata({ params, searchParams }) {
  const { industry, slug, province, page } = await load(params, searchParams);
  const where = M.common.inProvince(province?.name);
  return {
    title: `${M.list.industry.title(industry.code, industry.name)}${where}${M.common.pageSuffix(page)}`,
    description: M.list.industry.metaDescription(industry.code, industry.name, where),
    alternates: {
      canonical: buildHref(`/nganh/${industry.code}-${slug}`, { tinh: province?.slug, page }),
    },
  };
}

export async function IndustryList({ params, searchParams }) {
  const { industry, slug, province, options, page } = await load(params, searchParams);
  const basePath = `/nganh/${industry.code}-${slug}`;

  const data = await listCompanies({
    industry: industry.code,
    province: province?.code,
    sort: 'founded_desc',
    page,
  });
  const where = M.common.inProvince(province?.name);

  return (
    <ListPageShell
      aside={<IllusIndustry {...industryColor(industry.code)} className="w-[150px]" />}
      breadcrumb={[{ name: M.list.industry.crumb(industry.code) }]}
      title={M.list.industry.title(industry.code, industry.name)}
      description={M.list.industry.lead(where)}
      filters={
        <ListFilters
          key={province?.slug || ''}
          action={basePath}
          fields={[
            {
              name: 'tinh',
              label: M.list.provinceFilter,
              value: province?.slug || '',
              allLabel: M.list.allProvinces,
              options,
            },
          ]}
        />
      }
      data={data}
      basePath={basePath}
      params={{ tinh: province?.slug }}
      slotPrefix="industry"
    />
  );
}
