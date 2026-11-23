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
    // Hệ A: cùng khung, H1 cùng chỗ với mọi trang (breadcrumb trên 20 / dưới 16), không hình minh hoạ.
    // ≥ 1280px: lưới cột chính + cột phải (.rail-grid) — form rộng đúng cột chính 852, đoạn giới thiệu sang cột
    // phải, vạch 2px của nó nối liền vạch mở đầu form → một mép phải duy nhất cho mỗi cột, không còn đoạn chữ
    // 640 lửng giữa trang và khoảng trống bên phải suốt trang. Thứ tự DOM vẫn H1 → giới thiệu → form (đọc đúng
    // thứ tự trên điện thoại / trình đọc màn hình); dưới 1280 xếp một cột, cùng bề rộng 852 với form.
    <main className="site-wrap pb-12 md:pb-16">
      <div className="pt-3 pb-3 md:pt-5 md:pb-4">
        <Breadcrumb items={[{ name: M.updateRequest.title }]} />
      </div>
      <div className="rail-grid max-xl:max-w-[852px]">
        <h1 className="text-h1-m font-semibold text-pretty text-ink md:text-h1">
          {M.updateRequest.title}
        </h1>
        <p className="mt-2 text-body leading-7 text-pretty text-ink-2 xl:sticky xl:top-24 xl:col-start-2 xl:row-start-2 xl:mt-8 xl:rounded-xl xl:bg-white xl:p-6 xl:shadow-[0_0_0_0.5px_#dde0e7] xl:text-sm xl:leading-6">
          {M.updateRequest.intro}
        </p>
        <div className="mt-5 md:mt-8 xl:col-start-1 xl:row-start-2">
          <UpdateRequestForm initialMst={mst} initialCompany={initialCompany} />
        </div>
      </div>
    </main>
  );
}
