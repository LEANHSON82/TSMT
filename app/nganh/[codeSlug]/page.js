// DN theo ngành /nganh/{ma-nganh}-{slug} — trang 1 không lọc, ISR 1 giờ (spec mục 2, 3.5).
// ?tinh=&page=: rewrites() trong next.config.mjs chuyển vào route nội bộ q/[tinh]/[page] (cũng ISR), URL giữ nguyên.
import { IndustryList, industryListMetadata } from './view';

export const revalidate = 3600;
export const dynamicParams = true;
// Không dựng sẵn lúc build; render ở lượt truy cập đầu rồi cache (ISR).
export function generateStaticParams() {
  return [];
}

export function generateMetadata({ params }) {
  return industryListMetadata({ params, searchParams: {} });
}

export default function IndustryPage({ params }) {
  return <IndustryList params={params} searchParams={{}} />;
}
