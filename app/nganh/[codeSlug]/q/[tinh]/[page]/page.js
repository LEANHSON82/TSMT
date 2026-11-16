// Route nội bộ cho /nganh/{ma-nganh}-{slug}?tinh=&page= (middleware.js rewrite vào đây).
import { notFound } from 'next/navigation';
import { internalListQuery } from '@/lib/url';
import { IndustryList, industryListMetadata } from '../../../view';

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
  return industryListMetadata({ params, searchParams: query(params) });
}

export default function IndustryPagedPage({ params }) {
  return <IndustryList params={params} searchParams={query(params)} />;
}
