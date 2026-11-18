// DN mới thành lập /doanh-nghiep-moi-thanh-lap?tinh=&page= (spec mục 2, 3.5): sắp ngày thành lập mới nhất.
import AdvancedFilterLink from '@/components/AdvancedFilterLink';
import ListFilters from '@/components/ListFilters';
import ListPageShell from '@/components/ListPageShell';
import { IllusNewCompany } from '@/components/Illustrations';
import { listCompanies } from '@/lib/api';
import { M } from '@/lib/messages';
import { provinceOptions } from '@/lib/provinces';
import { buildHref, firstParam, pageNumber } from '@/lib/url';

async function load(searchParams) {
  const sp = await searchParams;
  const { options, bySlug } = await provinceOptions();
  return { province: bySlug(firstParam(sp.tinh)), options, page: pageNumber(sp.page) };
}

export async function newListMetadata({ searchParams }) {
  const { province, page } = await load(searchParams);
  const where = M.common.inProvince(province?.name);
  return {
    title: `${M.list.newCompanies.title}${where}${M.common.pageSuffix(page)}`,
    description: M.list.newCompanies.metaDescription(where),
    // Lọc theo tỉnh: nội dung trùng y hệt /tinh/{slug} (cùng sắp xếp mới nhất) → canonical về trang tỉnh.
    alternates: {
      canonical: province
        ? buildHref(`/tinh/${province.slug}`, { page })
        : buildHref('/doanh-nghiep-moi-thanh-lap', { page }),
    },
  };
}

export async function NewCompaniesList({ searchParams }) {
  const { province, options, page } = await load(searchParams);
  const data = await listCompanies({ province: province?.code, sort: 'founded_desc', page });
  const where = M.common.inProvince(province?.name);
  return (
    <ListPageShell
      aside={<IllusNewCompany className="w-[150px]" />}
      breadcrumb={[{ name: M.list.newCompanies.title }]}
      title={`${M.list.newCompanies.title}${where}`}
      description={M.list.newCompanies.lead(where)}
      filters={
        <div className="flex flex-col gap-1">
          <ListFilters
            key={province?.slug || ''}
            action="/doanh-nghiep-moi-thanh-lap"
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
          <AdvancedFilterLink params={{ tinh: province?.slug, thanhlap: '30-ngay' }} />
        </div>
      }
      data={data}
      basePath="/doanh-nghiep-moi-thanh-lap"
      params={{ tinh: province?.slug }}
      slotPrefix="new"
      showNew={false}
    />
  );
}
