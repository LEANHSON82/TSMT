// DN mới thành lập /doanh-nghiep-moi-thanh-lap?tinh=&page= (spec mục 2, 3.5): DN có ngày bắt đầu hoạt động trong 30
// ngày gần nhất, sắp ngày thành lập mới nhất.
import ListFilters from '@/components/ListFilters';
import ListPageShell from '@/components/ListPageShell';
import { searchCompanies } from '@/lib/api';
import { daysAgoVN } from '@/lib/filters';
import { M, NEW_WINDOW_DAYS } from '@/lib/messages';
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
    description: M.list.newCompanies.metaDescription(where, M.common.pageSuffix(page)),
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
  // «Mới» = ngày bắt đầu hoạt động trong 30 ngày gần nhất (giờ Việt Nam), mới nhất trước.
  const data = await searchCompanies({
    province: province?.code,
    foundedFrom: daysAgoVN(NEW_WINDOW_DAYS),
    sort: 'founded_desc',
    page,
  });
  const where = M.common.inProvince(province?.name);
  return (
    <ListPageShell
      breadcrumb={[{ name: M.list.newCompanies.title }]}
      title={`${M.list.newCompanies.title}${where}`}
      description={M.list.newCompanies.lead(where)}
      // Lọc tỉnh bên phải hàng số đếm. «Lọc nâng cao» đã có ở hàng ô tìm trên header.
      filters={
        <ListFilters
          key={province?.slug || ''}
          variant="inline"
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
      }
      data={data}
      basePath="/doanh-nghiep-moi-thanh-lap"
      params={{ tinh: province?.slug }}
      slotPrefix="new"
      showNew={false}
      emptyTitle={M.list.newCompanies.empty}
    />
  );
}
