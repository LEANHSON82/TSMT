// DN mới thành lập /doanh-nghiep-moi-thanh-lap — trang 1 không lọc, ISR 10 phút (spec mục 2, 3.5).
// ?tinh=&page=: middleware.js chuyển vào route nội bộ q/[tinh]/[page] (cũng ISR), URL giữ nguyên.
import { NewCompaniesList, newListMetadata } from './view';

export const revalidate = 600;

export function generateMetadata() {
  return newListMetadata({ searchParams: {} });
}

export default function NewCompaniesPage() {
  return <NewCompaniesList searchParams={{}} />;
}
