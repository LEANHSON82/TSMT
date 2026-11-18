import Link from 'next/link';
import StaticPage from '@/components/StaticPage';
import { M } from '@/lib/messages';
import { CONTACT_EMAIL } from '@/lib/site';

export const metadata = { ...M.staticPage.meta.contact, alternates: { canonical: '/lien-he' } };

export default function ContactPage() {
  return (
    <StaticPage
      title="Liên hệ"
      sections={[
        // Chưa có email chính thức (owner cung cấp qua NEXT_PUBLIC_CONTACT_EMAIL) thì không hiện chữ giữ chỗ.
        ...(CONTACT_EMAIL
          ? [
              {
                id: 'thong-tin',
                title: 'Thông tin liên hệ',
                body: (
                  <p>
                    Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                  </p>
                ),
              },
            ]
          : []),
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
