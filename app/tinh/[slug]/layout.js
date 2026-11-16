// Kiểm tra tham số ở layout (nằm NGOÀI vùng loading/Suspense) để trả đúng HTTP 404.
import { notFound } from 'next/navigation';
import { provinceOptions } from '@/lib/provinces';

export default async function ProvinceLayout({ params, children }) {
  const { slug } = await params;
  const { bySlug } = await provinceOptions();
  if (!bySlug(slug)) notFound();
  return children;
}
