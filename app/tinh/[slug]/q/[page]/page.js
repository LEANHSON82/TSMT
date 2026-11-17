// Route nội bộ cho /tinh/{slug}?page=N (rewrites() trong next.config.mjs chuyển vào đây; truy cập thẳng bị 301 về ?page=).
import { notFound } from 'next/navigation';
import { internalListQuery } from '@/lib/url';
import { ProvinceList, provinceListMetadata } from '../../view';

export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

async function query(params) {
  const q = internalListQuery(await params);
  if (!q) notFound();
  return q;
}

export function generateMetadata({ params }) {
  return provinceListMetadata({ params, searchParams: query(params) });
}

export default function ProvincePagedPage({ params }) {
  return <ProvinceList params={params} searchParams={query(params)} />;
}
