// Kiểm tra mã ngành + redirect slug sai ở layout (ngoài vùng loading/Suspense) để trả đúng mã HTTP.
import { notFound, permanentRedirect } from 'next/navigation';
import { resolveIndustry } from '@/lib/industry';

export default async function IndustryLayout({ params, children }) {
  const { codeSlug } = await params;
  const r = await resolveIndustry(codeSlug);
  if (!r) notFound();
  if (r.givenSlug !== r.slug) permanentRedirect(`/nganh/${r.industry.code}-${r.slug}`);
  return children;
}
