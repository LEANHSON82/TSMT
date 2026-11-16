// DN theo tỉnh /tinh/{slug-tinh} — trang 1, ISR 1 giờ (spec mục 2, 3.5).
// ?page=N (N > 1): middleware.js chuyển vào route nội bộ q/[page] (cũng ISR), URL vẫn giữ ?page=.
import { ProvinceList, provinceListMetadata } from './view';

export const revalidate = 3600;
export const dynamicParams = true;
// Không dựng sẵn lúc build; render ở lượt truy cập đầu rồi cache (ISR).
export function generateStaticParams() {
  return [];
}

export function generateMetadata({ params }) {
  return provinceListMetadata({ params, searchParams: {} });
}

export default function ProvincePage({ params }) {
  return <ProvinceList params={params} searchParams={{}} />;
}
