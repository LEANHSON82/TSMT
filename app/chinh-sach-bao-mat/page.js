import Link from 'next/link';
import StaticPage from '@/components/StaticPage';
import { SITE_NAME } from '@/lib/site';
import { M } from '@/lib/messages';

export const metadata = {
  ...M.staticPage.meta.privacy,
  alternates: { canonical: '/chinh-sach-bao-mat' },
};

// Theo spec mục 8.3: nêu nguồn dữ liệu công khai, mục đích, cách yêu cầu ẩn/xoá, việc dùng cookie quảng cáo.
// Cần owner xem cùng luật sư (Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân).
export default function PrivacyPage() {
  return (
    <StaticPage
      title="Chính sách bảo mật"
      intro={`Chính sách này giải thích ${SITE_NAME} thu thập, sử dụng và bảo vệ dữ liệu như thế nào.`}
      sections={[
        {
          id: 'nguon-du-lieu',
          title: 'Nguồn dữ liệu',
          body: (
            <p>
              Thông tin doanh nghiệp được tổng hợp từ nguồn công khai (thông tin đăng ký doanh
              nghiệp, đăng ký thuế).
            </p>
          ),
        },
        {
          id: 'muc-dich',
          title: 'Mục đích sử dụng',
          body: (
            <p>Giúp người dùng tra cứu, xác minh đối tác. Chúng tôi không bán dữ liệu cá nhân.</p>
          ),
        },
        {
          id: 'du-lieu-ca-nhan',
          title: 'Dữ liệu cá nhân của chủ doanh nghiệp',
          body: (
            <p>
              Số điện thoại, email, tên người đại diện có thể là dữ liệu cá nhân theo Nghị định
              13/2023/NĐ-CP. Số điện thoại không hiển thị sẵn trên trang và chỉ hiện sau thao tác
              của người xem.
            </p>
          ),
        },
        {
          id: 'an-xoa',
          title: 'Yêu cầu ẩn hoặc xoá thông tin',
          body: (
            <p>
              Gửi yêu cầu qua <Link href="/yeu-cau-cap-nhat">form yêu cầu ẩn/sửa thông tin</Link>.
              Thời gian xử lý: [owner chốt].
            </p>
          ),
        },
        {
          id: 'cookie',
          title: 'Cookie và quảng cáo',
          body: (
            <p>
              Chúng tôi dùng cookie cho thống kê (Google Analytics) và quảng cáo (Google Ad
              Manager). Bạn có thể thay đổi lựa chọn bất cứ lúc nào qua nút «Tuỳ chỉnh cookie» ở
              cuối trang.
            </p>
          ),
        },
        {
          id: 'lien-he',
          title: 'Liên hệ',
          body: (
            <p>
              Xem trang <Link href="/lien-he">Liên hệ</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
