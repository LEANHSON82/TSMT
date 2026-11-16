import StaticPage from '@/components/StaticPage';
import { SITE_NAME } from '@/lib/site';
import { M } from '@/lib/messages';
import { IllusLegal } from '@/components/Illustrations';

export const metadata = { ...M.staticPage.meta.terms, alternates: { canonical: '/dieu-khoan' } };

export default function TermsPage() {
  return (
    <StaticPage
      illustration={<IllusLegal className="w-[130px]" />}
      title="Điều khoản sử dụng"
      sections={[
        {
          id: 'nguon',
          title: 'Nguồn dữ liệu',
          body: (
            <p>
              Dữ liệu trên {SITE_NAME} được tổng hợp từ nguồn công khai và chỉ mang tính tham khảo.
              Hãy đối chiếu với cơ quan có thẩm quyền trước khi giao dịch.
            </p>
          ),
        },
        {
          id: 'su-dung',
          title: 'Sử dụng hợp lệ',
          body: (
            <ul>
              <li>Không thu thập dữ liệu tự động hàng loạt (crawl, scrape).</li>
              <li>Không dùng thông tin để quấy rối, gửi tin rác.</li>
            </ul>
          ),
        },
        {
          id: 'quang-cao',
          title: 'Quảng cáo',
          body: (
            <p>
              Trang hiển thị quảng cáo của bên thứ ba. Số điện thoại chỉ hiện sau khi xem một video
              quảng cáo ngắn.
            </p>
          ),
        },
        {
          id: 'trach-nhiem',
          title: 'Giới hạn trách nhiệm',
          body: <p>[Nội dung do luật sư soạn]</p>,
        },
      ]}
    />
  );
}
