// Yêu cầu ẩn/sửa thông tin /yeu-cau-cap-nhat?mst=... (spec mục 3.6, 8.3).
import Breadcrumb from '@/components/Breadcrumb';
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
    <main className="flex w-full flex-col">
      <div className="border-b border-line bg-white">
        <header className="mx-auto flex max-w-[880px] flex-col gap-3 px-4 pt-4 pb-5 md:px-6 md:pt-6 md:pb-7">
          <Breadcrumb items={[{ name: M.updateRequest.title }]} />
          <h1 className="text-2xl leading-8 font-semibold text-navy md:text-[32px] md:leading-10">
            {M.updateRequest.title}
          </h1>
          <p className="max-w-2xl text-body leading-6 text-ink-2">{M.updateRequest.intro}</p>
        </header>
      </div>
      <div className="mx-auto w-full max-w-[880px] px-4 pt-6 pb-12 md:px-6">
        <UpdateRequestForm initialMst={mst} initialCompany={initialCompany} />
      </div>
    </main>
  );
}
