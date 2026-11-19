import Link from 'next/link';
import StaticPage from '@/components/StaticPage';
import { M } from '@/lib/messages';

export const metadata = { ...M.staticPage.meta.contact, alternates: { canonical: '/lien-he' } };

export default function ContactPage() {
  return (
    <StaticPage
      title="Liên hệ"
      sections={[
        {
          id: 'thong-tin',
          title: 'Thông tin liên hệ',
          body: (
            <ul>
              <li>Email: [email liên hệ — owner cung cấp]</li>
              <li>Hợp tác quảng cáo: [email — owner cung cấp]</li>
            </ul>
          ),
        },
        {
          id: 'an-sua',
          title: 'Ẩn hoặc sửa thông tin doanh nghiệp',
          body: (
            <p>
              Vui lòng dùng <Link href="/yeu-cau-cap-nhat">form yêu cầu ẩn/sửa thông tin</Link> để
              được xử lý nhanh nhất.
            </p>
          ),
        },
      ]}
    />
  );
}
