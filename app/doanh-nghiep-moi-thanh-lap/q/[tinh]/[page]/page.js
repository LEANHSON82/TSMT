// Route nội bộ cho /doanh-nghiep-moi-thanh-lap?tinh=&page= (rewrites() trong next.config.mjs chuyển vào đây).
import { notFound } from 'next/navigation';
import { internalListQuery } from '@/lib/url';
import { NewCompaniesList, newListMetadata } from '../../../view';

export const revalidate = 600;
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
  return newListMetadata({ searchParams: query(params) });
}

export default function NewCompaniesPagedPage({ params }) {
  return <NewCompaniesList searchParams={query(params)} />;
}
