import Link from 'next/link';
import { M } from '@/lib/messages';
import { SITE_NAME } from '@/lib/site';
import Logo from './Logo';
import { CookieSettingsButton } from './CookieConsent';

const LINKS = [
  ['/gioi-thieu', M.footer.about],
  ['/lien-he', M.footer.contact],
  ['/dieu-khoan', M.footer.terms],
  ['/chinh-sach-bao-mat', M.footer.privacy],
];

// Footer gọn hệ A (spec mục 3): logo + «Dữ liệu tổng hợp từ nguồn công khai.» · link trang tĩnh · «Yêu cầu
// ẩn/sửa thông tin»; dòng © bên dưới, ngăn bằng đường kẻ mảnh. Nền trắng, viền trên mảnh (kiểu Pappers).
// Trang tự đệm đáy (pb-12 / md:pb-16) trước footer.
// Bố cục: điện thoại xếp dọc; 768–1279 hai hàng có chủ đích (hàng 1: logo + mô tả trái, «Yêu cầu ẩn/sửa» phải;
// hàng 2: link trang tĩnh) thay vì để một link rớt dòng lẻ loi; từ 1280 đủ chỗ cho một hàng.
export default function SiteFooter() {
  // Vùng bấm 44px (spec 7.3).
  const linkCls =
    'inline-flex min-h-11 items-center text-sm text-ink-2 no-underline hover:text-brand';
  return (
    <footer className="border-t-[3px] border-chrome bg-white">
      <div className="site-wrap flex flex-col items-start gap-2 pt-6 pb-2 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-x-8 md:gap-y-1 md:pt-7 md:pb-5 xl:flex xl:flex-row xl:justify-between">
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4">
          <Logo title={SITE_NAME} className="h-[15px] w-auto" />
          <p className="text-sm text-ink-2">{M.footer.dataSource}</p>
        </div>
        <nav
          aria-label={M.footer.navLabel}
          className="grid w-full grid-cols-2 gap-x-4 md:col-span-2 md:row-start-2 md:flex md:w-auto md:flex-wrap md:gap-x-6"
        >
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} prefetch={false} className={linkCls}>
              {label}
            </Link>
          ))}
          <CookieSettingsButton
            className={`${linkCls} cursor-pointer justify-self-start bg-transparent text-left`}
          />
        </nav>
        <Link
          prefetch={false}
          href="/yeu-cau-cap-nhat"
          className="inline-flex min-h-11 items-center text-sm font-semibold no-underline hover:underline hover:underline-offset-[3px] md:col-start-2 md:row-start-1"
        >
          {M.nav.updateRequest}
        </Link>
      </div>
      <div className="site-wrap pt-3 pb-7">
        <p className="border-t border-line pt-3 text-meta text-muted">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
