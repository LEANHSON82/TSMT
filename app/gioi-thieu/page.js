import Link from 'next/link';
import StaticPage from '@/components/StaticPage';
import { SITE_NAME } from '@/lib/site';
import { M } from '@/lib/messages';
import { IllusAbout } from '@/components/Illustrations';

export const metadata = { ...M.staticPage.meta.about, alternates: { canonical: '/gioi-thieu' } };

export default function AboutPage() {
  return (
    <StaticPage
      illustration={<IllusAbout className="w-[130px]" />}
      title={`Giới thiệu ${SITE_NAME}`}
      intro={`${SITE_NAME} giúp tra cứu nhanh, miễn phí thông tin doanh nghiệp Việt Nam theo mã số thuế, tên doanh nghiệp hoặc người đại diện.`}
      sections={[
        {
          id: 'muc-dich',
          title: 'Chúng tôi làm gì',
          body: (
            <p>
              Tổng hợp thông tin đăng ký doanh nghiệp từ nguồn công khai: mã số thuế, địa chỉ, người
              đại diện, ngành nghề, tình trạng hoạt động.
            </p>
          ),
        },
        {
          id: 'mien-phi',
          title: 'Miễn phí nhờ quảng cáo',
          body: (
            <p>
              Mọi thông tin đều xem miễn phí. Riêng số điện thoại hiện sau khi bạn xem một video
              quảng cáo ngắn — đây là cách chúng tôi duy trì dịch vụ.
            </p>
          ),
        },
        {
          id: 'cap-nhat',
          title: 'Cập nhật và chỉnh sửa',
          body: (
            <p>
              Chủ doanh nghiệp có thể{' '}
              <Link href="/yeu-cau-cap-nhat">gửi yêu cầu ẩn hoặc sửa thông tin</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
