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
// ẩn/sửa thông tin. Nền sáng, chia cột: giới thiệu ngắn · liên kết · dữ liệu.
export default function SiteFooter() {
  const linkCls =
    'inline-flex min-h-11 items-center text-sm text-ink-2 no-underline hover:text-brand';
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pt-10 pb-8 md:grid-cols-[1.5fr_1fr_1.2fr] md:gap-10 md:px-6">
        <div className="flex flex-col gap-3">
          <Logo title={SITE_NAME} className="h-6 w-auto self-start" />
          <p className="max-w-xs text-sm leading-6 text-ink-2">{M.footer.tagline}</p>
        </div>
        <nav aria-label={M.footer.navLabel} className="flex flex-col">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
            {M.footer.linksTitle}
          </p>
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={linkCls}>
              {label}
            </Link>
          ))}
          <CookieSettingsButton className={`${linkCls} cursor-pointer self-start bg-transparent`} />
        </nav>
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
            {M.footer.dataTitle}
          </p>
          <p className="text-sm leading-6 text-ink-2">{M.footer.dataSource}</p>
          <Link
            href="/yeu-cau-cap-nhat"
            className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold no-underline"
          >
            <IconEyeOff size={18} />
            {M.nav.updateRequest}
          </Link>
        </div>
      </div>
      <div className="border-t border-line-soft">
        <p className="mx-auto max-w-[1200px] px-4 py-4 text-[13px] text-muted md:px-6">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
