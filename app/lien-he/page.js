import Link from 'next/link';
import StaticPage from '@/components/StaticPage';
import { M } from '@/lib/messages';

// Email liên hệ do chủ dự án cung cấp qua biến môi trường; chưa có thì chỉ đường sang form (không hiện chỗ trống).
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';
const ADS_EMAIL = process.env.NEXT_PUBLIC_ADS_EMAIL || '';

export const metadata = { ...M.staticPage.meta.contact, alternates: { canonical: '/lien-he' } };

export default function ContactPage() {
  return (
    <StaticPage
      title="Liên hệ"
      sections={[
        {
          id: 'thong-tin',
          title: 'Thông tin liên hệ',
          body:
            CONTACT_EMAIL || ADS_EMAIL ? (
              <ul>
                {CONTACT_EMAIL && (
                  <li>
                    {M.staticPage.contactEmail}: <span className="select-all">{CONTACT_EMAIL}</span>
                  </li>
                )}
                {ADS_EMAIL && (
                  <li>
                    {M.staticPage.adsEmail}: <span className="select-all">{ADS_EMAIL}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p>{M.staticPage.contactViaForm}</p>
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
