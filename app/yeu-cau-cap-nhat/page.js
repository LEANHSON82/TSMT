// Yêu cầu ẩn/sửa thông tin /yeu-cau-cap-nhat?mst=... (spec mục 3.6, 8.3).
import Breadcrumb from '@/components/Breadcrumb';
import UpdateRequestForm from '@/components/UpdateRequestForm';
import { isValidMst, normalizeMst } from '@/lib/mst';
import { firstParam } from '@/lib/url';
import { M } from '@/lib/messages';
import { IllusForm } from '@/components/Illustrations';

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
  return (
    <main className="mx-auto flex w-full max-w-[880px] flex-col gap-5 px-4 pt-4 pb-12 md:px-6 md:pt-6">
      <Breadcrumb items={[{ name: M.updateRequest.title }]} />
      <header className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-2xl leading-8 font-semibold text-navy md:text-[28px] md:leading-9">
            {M.updateRequest.title}
          </h1>
          <p className="max-w-2xl text-[15px] leading-6 text-ink-2">{M.updateRequest.intro}</p>
        </div>
        <IllusForm className="hidden w-[140px] flex-none sm:block" />
      </header>
      <UpdateRequestForm initialMst={mst} />
    </main>
  );
}
