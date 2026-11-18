import NotFoundContent from '@/components/NotFoundContent';
import { M } from '@/lib/messages';

// Không tự khai robots: Next tự thêm <meta name="robots" content="noindex"> cho phản hồi 404 (khai thêm
// sẽ thành 2 thẻ trùng).
export const metadata = {
  title: M.notFound.title,
};

// Trả đúng HTTP 404 (spec mục 2). Có ô tìm kiếm để người dùng tìm lại (spec mục 3.4).
export default function NotFound() {
  return <NotFoundContent />;
}
