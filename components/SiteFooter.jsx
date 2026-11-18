import Link from 'next/link';
import { M } from '@/lib/messages';
import { SITE_NAME } from '@/lib/site';
import Logo from './Logo';
import { CookieSettingsButton } from './CookieConsent';
import { IconEyeOff } from './Icons';

const LINKS = [
  ['/gioi-thieu', M.footer.about],
  ['/lien-he', M.footer.contact],
  ['/dieu-khoan', M.footer.terms],
  ['/chinh-sach-bao-mat', M.footer.privacy],
];

// Footer (spec mục 3): link trang tĩnh, dòng «Dữ liệu tổng hợp từ nguồn công khai», link yêu cầu
// ẩn/sửa thông tin. Nền navy, chia cột: giới thiệu ngắn · liên kết · dữ liệu.
export default function SiteFooter() {
  const linkCls =
    'inline-flex min-h-11 items-center text-sm text-white/80 no-underline hover:text-white';
  return (
    // Nền navy (cùng dải đầu trang chủ): khép trang lại rõ ràng, tách hẳn khỏi nội dung.
    <footer className="on-dark mt-auto bg-navy text-white">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 pt-8 pb-6 md:grid-cols-[1.5fr_1fr_1.2fr] md:gap-10 md:px-6 md:pt-10 md:pb-8">
        <div className="flex flex-col gap-3">
          <Logo tone="dark" title={SITE_NAME} className="h-6 w-auto self-start" />
          <p className="max-w-xs text-sm leading-6 text-white/75">{M.footer.tagline}</p>
        </div>
        {/* Điện thoại: link xếp 2 cột (mỗi link vẫn cao 44px — spec 7.3) cho footer ngắn lại. */}
        <nav aria-label={M.footer.navLabel}>
          <p className="mb-1 text-xs font-semibold tracking-wide text-white/60 uppercase">
            {M.footer.linksTitle}
          </p>
          <div className="grid grid-cols-2 gap-x-4 md:grid-cols-1">
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} prefetch={false} className={linkCls}>
                {label}
              </Link>
            ))}
            <CookieSettingsButton
              className={`${linkCls} cursor-pointer justify-self-start bg-transparent text-left`}
            />
          </div>
        </nav>
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-xs font-semibold tracking-wide text-white/60 uppercase">
            {M.footer.dataTitle}
          </p>
          <p className="text-sm leading-6 text-white/80">{M.footer.dataSource}</p>
          <Link
            prefetch={false}
            href="/yeu-cau-cap-nhat"
            className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-white no-underline hover:text-white/80"
          >
            <IconEyeOff size={18} />
            {M.nav.updateRequest}
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1200px] px-4 py-4 text-meta text-white/60 md:px-6">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
