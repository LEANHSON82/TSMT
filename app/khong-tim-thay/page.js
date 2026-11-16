// Trang 404 render tĩnh (đủ HTML từ server). middleware.js rewrite các URL DN không tồn tại / sai
// định dạng về đây kèm mã HTTP 404. Truy cập thẳng /khong-tim-thay: noindex.
import NotFound, { metadata as notFoundMetadata } from '../not-found';

export const dynamic = 'force-static';
export const metadata = notFoundMetadata;

export default function NotFoundPage() {
  return <NotFound />;
}
