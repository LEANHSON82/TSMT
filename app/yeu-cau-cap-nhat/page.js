// Yêu cầu ẩn/sửa thông tin /yeu-cau-cap-nhat?mst=... (spec mục 3.6, 8.3).
import PageHero, { PAGE_H1 } from '@/components/PageHero';
import UpdateRequestForm from '@/components/UpdateRequestForm';
import { getCompany } from '@/lib/api';
import { companyPath, isValidMst, normalizeMst } from '@/lib/mst';
import { firstParam } from '@/lib/url';
import { M } from '@/lib/messages';

export const metadata = {
  title: M.updateRequest.metaTitle,
  description: M.updateRequest.metaDescription,
  alternates: { canonical: '/yeu-cau-cap-nhat' },
  robots: { index: true, follow: true },
};

export default async function UpdateRequestPage({ searchParams }) {
  const sp = await searchParams;
  const raw = firstParam(sp.mst);
  const mst = raw && isValidMst(raw) ? normalizeMst(raw) : '';
  const company = mst ? await getCompany(mst).catch(() => null) : null;
  const initialCompany = company
    ? { mst: company.mst, name: company.name, path: companyPath(company) }
    : null;
  return (
    // Dải đầu trang dùng chung (PageHero): breadcrumb, H1, câu giới thiệu. Form bên dưới rộng 852px.
    <main className="pb-12 md:pb-16">
      <PageHero breadcrumb={[{ name: M.updateRequest.title }]}>
        <h1 className={PAGE_H1}>{M.updateRequest.title}</h1>
        <p className="mt-2 max-w-[760px] text-sm text-pretty text-ink-2 md:text-[15px]">
          {M.updateRequest.intro}
        </p>
      </PageHero>
      <div className="site-wrap">
        <div className="mt-5 max-w-[852px] md:mt-8">
          <UpdateRequestForm initialMst={mst} initialCompany={initialCompany} />
        </div>
      </div>
    </main>
  );
}
