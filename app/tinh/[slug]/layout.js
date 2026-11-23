// Kiểm tra tham số ở layout (nằm NGOÀI vùng loading/Suspense) để trả đúng HTTP 404.
import { notFound } from 'next/navigation';
import { provinceOptions } from '@/lib/provinces';

export default async function ProvinceLayout({ params, children }) {
  const { slug } = await params;
  const { provinces, bySlug } = await provinceOptions();
  // Không lấy được danh mục tỉnh (API lỗi): báo lỗi chứ không trả 404 — lỗi thì Next giữ bản cũ đã cache, còn 404
  // sẽ bị cache cả giờ và Google có thể gỡ trang khỏi chỉ mục.
  if (!provinces.length) throw new Error('Không tải được danh mục tỉnh/thành');
  if (!bySlug(slug)) notFound();
  return children;
}
