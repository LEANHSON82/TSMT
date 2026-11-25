'use client';

// Header hệ A (spec mục 3): hàng 1 logo + menu Tỉnh/thành · Ngành nghề · DN mới (vạch dưới mục đang xem);
// hàng 2 ô tìm (rộng đúng cột chính 852px) + nút Tìm + link «Lọc nâng cao» ở cột phải.
// Dính đầu trang: khi cuộn, hàng 1 trôi đi, hàng 2 ở lại (top âm, xem .site-header trong globals.css).
// Trang chủ: hàng 2 thay bằng hero (H1 + ô tìm lớn, app/page.js) cùng lưới .find-grid nên ô tìm trùng khít;
// hàng 2 của header chỉ hiện (phủ lên, không xô trang) khi ô tìm hero đã cuộn khuất.
// Máy tính / máy tính bảng (≥ 768px): dropdown (Esc / bấm ra ngoài để đóng, focus quay về nút).
// Điện thoại: nút menu (hamburger) → menu toàn màn hình + danh sách con có nút «‹ Menu».
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { M } from '@/lib/messages';
import { sortProvinces } from '@/lib/province-order';
import { SITE_NAME } from '@/lib/site';
import { buildHref } from '@/lib/url';
import IndustryCode from './IndustryCode';
import { trapTab } from './focusTrap';
import Logo from './Logo';
import SearchBox from './SearchBox';
import {
  IconBriefcase,
  IconCalendarPlus,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconEyeOff,
  IconMapPin,
  IconMenu,
} from './Icons';

// Ô tìm hàng 2 header: cùng khuôn với ô tìm trang chủ (SearchBox tự chọn chữ gợi ý ngắn dưới 640px).
// Điện thoại: «Lọc nâng cao» là nút icon ngay sau nút Tìm (addon), không chiếm thêm một hàng.
const navSearch = (filterHref) => ({
  size: 'nav',
  searchLabel: M.search.navSearchLabel,
  addon: <AdvancedSearchIcon href={filterHref} className="md:hidden" />,
});

function SearchWithQuery({ filterHref }) {
  const q = useSearchParams().get('q') || '';
  return <SearchBox key={q} defaultValue={q} {...navSearch(filterHref)} />;
}

// Lối vào bộ lọc nâng cao (/tim-kiem) theo trang đang xem: trang tỉnh / ngành / DN mới mở sẵn bộ lọc đó.
function advancedHref(pathname) {
  const tinh = pathname.match(/^\/tinh\/([^/]+)/)?.[1];
  if (tinh) return buildHref('/tim-kiem', { tinh });
  const nganh = pathname.match(/^\/nganh\/(\d+)/)?.[1];
  if (nganh) return buildHref('/tim-kiem', { nganh });
  if (pathname === '/doanh-nghiep-moi-thanh-lap')
    return buildHref('/tim-kiem', { thanhlap: '30-ngay' });
  return '/tim-kiem';
}

function FilterIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
      className="flex-none"
    >
      <path d="M3 6h18M6 12h12M10 18h4" />
    </svg>
  );
}

// Link «Lọc nâng cao» cạnh ô tìm (hàng 2 header, hero trang chủ). Cao bằng ô tìm để căn giữa theo ô.
export function AdvancedSearchLink({ href = '/tim-kiem', className = '' }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`inline-flex min-h-11 items-center gap-2 font-semibold whitespace-nowrap no-underline hover:text-brand-hover ${className}`}
    >
      <FilterIcon />
      {M.list.advancedFilter}
    </Link>
  );
}

// Điện thoại: cùng lối vào nhưng chỉ icon, 44×44, viền xám như ô tìm. Tên đọc + tooltip = «Lọc nâng cao».
function AdvancedSearchIcon({ href, className = '' }) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={M.list.advancedFilter}
      title={M.list.advancedFilter}
      className={`inline-flex h-11 w-11 flex-none items-center justify-center rounded-md border border-line-strong bg-white text-ink-2 no-underline hover:border-brand hover:text-brand ${className}`}
    >
      <FilterIcon size={20} />
    </Link>
  );
}

// Header sáng kiểu BizLookup (cao 56px, nền trắng, viền dưới mảnh + bóng nhẹ): mục menu chữ navy 15px đậm; rê chuột nền
// xám rất nhạt + chữ xanh; trang đang xem chữ xanh + vạch xanh 3px sát đáy; bảng thả xuống đang mở giữ nền xám nhạt.
const NAV_ITEM =
  'nav-item inline-flex h-14 items-center gap-1 px-4 text-[15px] font-semibold whitespace-nowrap text-title no-underline hover:bg-silver-2 hover:text-brand';
const CURRENT_BAR = 'text-brand shadow-[inset_0_-3px_0_var(--color-brand)] hover:text-brand';

function DesktopDropdown({ id, label, open, current, onToggle, onClose, children }) {
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        btnRef.current?.focus();
      }
    };
    const outside = (t) => !panelRef.current?.contains(t) && !btnRef.current?.contains(t);
    const onClick = (e) => outside(e.target) && onClose();
    // Tab ra khỏi nút + bảng thì đóng bảng (không để focus đi vào nội dung nằm dưới bảng).
    const onFocus = (e) => outside(e.target) && onClose();
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('focusin', onFocus);
    };
  }, [open, onClose]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-current={current ? 'true' : undefined}
        onClick={onToggle}
        className={`${NAV_ITEM} cursor-pointer bg-transparent ${
          current ? CURRENT_BAR : open ? 'bg-silver-2 text-title' : ''
        }`}
      >
        {label}
        <IconChevronDown
          size={16}
          strokeWidth={1.6}
          className={`text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        ref={panelRef}
        id={id}
        hidden={!open}
        className="motion-drop absolute top-full right-0 left-0 z-30 border-b border-line bg-white text-ink normal-case shadow-[0_8px_24px_rgba(22,27,38,0.12)]"
      >
        <div className="site-wrap pt-5 pb-6">{children}</div>
      </div>
    </>
  );
}

function MobileMenu({ provinces, industries, pathname, onClose }) {
  const [sub, setSub] = useState(null); // null | 'provinces' | 'industries'
  const closeRef = useRef(null);
  const backRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    (sub ? backRef : closeRef).current?.focus();
  }, [sub]);

  useEffect(() => {
    // Esc đóng; Tab không thoát ra nội dung trang đang bị menu che (spec 7.3).
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else trapTab(e, panelRef.current);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const itemCls =
    'flex min-h-[60px] items-center gap-3.5 border-b border-line-soft px-4 text-lg font-semibold no-underline hover:bg-page';
  // Mục của trang đang xem: nền nhạt + vạch trái.
  const currentCls = 'bg-brand-50 text-brand shadow-[inset_3px_0_0_var(--color-brand)]';
  const cur = (on) => (on ? currentCls : 'text-navy');

  return (
    <>
      {/* Chỉ điện thoại (< 768px): phủ toàn màn hình. Từ 768px menu chữ đã nằm trên hàng 1. */}
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={
          sub === 'provinces'
            ? M.nav.provinces
            : sub === 'industries'
              ? M.nav.industries
              : M.nav.menu
        }
        className="motion-slide-in fixed inset-0 z-50 flex flex-col bg-white md:hidden"
      >
        {sub ? (
          <>
            <div className="grid h-14 flex-none grid-cols-[96px_minmax(0,1fr)_96px] items-center border-b border-line px-2 md:h-16">
              <button
                ref={backRef}
                type="button"
                onClick={() => setSub(null)}
                aria-label={M.nav.backToMain}
                className="inline-flex h-11 items-center gap-0.5 justify-self-start rounded pr-2.5 pl-1 text-body font-semibold text-brand"
              >
                <IconChevronLeft size={22} strokeWidth={1.8} />
                {M.nav.backToMenu}
              </button>
              <h2 className="truncate text-center text-lg font-semibold text-navy">
                {sub === 'provinces' ? M.nav.provinces : M.nav.industries}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={M.nav.closeMenu}
                className="inline-flex h-11 w-11 items-center justify-center justify-self-end rounded text-navy"
              >
                <IconClose size={24} strokeWidth={1.6} />
              </button>
            </div>
            <nav
              aria-label={sub === 'provinces' ? M.nav.provinces : M.nav.industries}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <ul>
                {sub === 'provinces'
                  ? provinces.map((p) => (
                      <li key={p.code}>
                        <Link
                          href={`/tinh/${p.slug}`}
                          onClick={onClose}
                          aria-current={pathname === `/tinh/${p.slug}` ? 'page' : undefined}
                          className={`flex min-h-[52px] items-center justify-between border-t border-line-soft px-4 text-base text-navy no-underline ${cur(pathname === `/tinh/${p.slug}`)}`}
                        >
                          {p.name}
                          <IconChevronRight size={18} className="text-muted" />
                        </Link>
                      </li>
                    ))
                  : industries.map((n) => (
                      <li key={n.code}>
                        <Link
                          href={n.href}
                          onClick={onClose}
                          className="flex min-h-[60px] items-center gap-3 border-t border-line-soft px-4 py-2 text-navy no-underline"
                        >
                          <IndustryCode code={n.code} />
                          <span className="flex-1 text-body leading-[21px]">{n.name}</span>
                          <IconChevronRight size={18} className="flex-none text-muted" />
                        </Link>
                      </li>
                    ))}
              </ul>
            </nav>
          </>
        ) : (
          <>
            <div className="flex h-14 flex-none items-center justify-between border-b border-line pr-2 pl-4 md:h-16 md:px-4">
              <Link
                href="/"
                onClick={onClose}
                className="inline-flex min-h-11 items-center text-base font-semibold text-brand no-underline"
              >
                {M.nav.home}
              </Link>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={M.nav.closeMenu}
                aria-expanded="true"
                aria-controls="mobile-menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded bg-brand-50 text-navy"
              >
                <IconClose size={24} strokeWidth={1.6} />
              </button>
            </div>
            <nav aria-label={M.nav.mainMenu} className="flex flex-1 flex-col py-2">
              <button
                type="button"
                className={`${itemCls} w-full text-left ${cur(pathname.startsWith('/tinh/'))}`}
                onClick={() => setSub('provinces')}
              >
                <IconMapPin size={22} className="flex-none text-brand" />
                <span className="flex-1">{M.nav.provinces}</span>
                <IconChevronRight size={18} className="text-muted" />
              </button>
              <button
                type="button"
                className={`${itemCls} w-full text-left ${cur(pathname.startsWith('/nganh/'))}`}
                onClick={() => setSub('industries')}
              >
                <IconBriefcase size={22} className="flex-none text-brand" />
                <span className="flex-1">{M.nav.industries}</span>
                <IconChevronRight size={18} className="text-muted" />
              </button>
              <Link
                href="/doanh-nghiep-moi-thanh-lap"
                prefetch={false}
                onClick={onClose}
                aria-current={pathname === '/doanh-nghiep-moi-thanh-lap' ? 'page' : undefined}
                className={`${itemCls} ${cur(pathname === '/doanh-nghiep-moi-thanh-lap')}`}
              >
                <IconCalendarPlus size={22} className="flex-none text-brand" />
                <span className="flex-1">{M.nav.newCompanies}</span>
                <IconChevronRight size={18} className="text-muted" />
              </Link>
              <Link
                href="/yeu-cau-cap-nhat"
                onClick={onClose}
                aria-current={pathname === '/yeu-cau-cap-nhat' ? 'page' : undefined}
                className={`${itemCls} ${cur(pathname === '/yeu-cau-cap-nhat')}`}
              >
                <IconEyeOff size={22} className="flex-none text-brand" />
                <span className="flex-1">{M.nav.updateRequest}</span>
                <IconChevronRight size={18} className="text-muted" />
              </Link>
            </nav>
          </>
        )}
      </div>
    </>
  );
}

export default function HeaderBar({ provinces, industries }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [dropdown, setDropdown] = useState(null); // 'provinces' | 'industries' | null
  const [mobileOpen, setMobileOpen] = useState(false);
  // Trang chủ chắc chắn có ô tìm lớn nên mặc định ẩn hàng ô tìm của header (tránh nháy khi tải).
  const [heroSearchVisible, setHeroSearchVisible] = useState(isHome);
  const menuBtnRef = useRef(null);
  const findRef = useRef(null);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  // Menu điện thoại đang mở mà màn hình rộng ra ≥ 768px (xoay ngang máy tính bảng): đóng để không kẹt
  // body overflow: hidden khi menu đã bị CSS ẩn.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => mq.matches && setMobileOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mobileOpen]);

  // Trang chủ: ô tìm hero ([data-hero-search]) khuất dưới hàng ô tìm dính thì mới hiện hàng đó.
  useEffect(() => {
    if (!isHome) return undefined;
    const hero = document.querySelector('[data-hero-search]');
    if (!hero || typeof IntersectionObserver === 'undefined') {
      setHeroSearchVisible(false);
      return undefined;
    }
    // Hàng ô tìm dính cao offsetHeight, cách mép trên 8px (phần còn lại của hàng 1).
    const top = (findRef.current?.offsetHeight || 76) + 8;
    const io = new IntersectionObserver(([entry]) => setHeroSearchVisible(entry.isIntersecting), {
      rootMargin: `-${top}px 0px 0px 0px`,
    });
    io.observe(hero);
    return () => io.disconnect();
  }, [isHome]);

  const showHeaderSearch = !isHome || !heroSearchVisible;
  const sortedProvinces = sortProvinces(provinces);
  const closeDropdown = () => setDropdown(null);
  const filterHref = advancedHref(pathname);

  // Ô tìm của header: trang kết quả giữ sẵn từ khoá đang tìm (useSearchParams chỉ chạy trên /tim-kiem — trang vốn
  // render động; các trang tĩnh/ISR khác không bị chuyển sang render phía trình duyệt).
  const search =
    pathname === '/tim-kiem' ? (
      <Suspense fallback={<SearchBox {...navSearch(filterHref)} />}>
        <SearchWithQuery filterHref={filterHref} />
      </Suspense>
    ) : (
      <SearchBox {...navSearch(filterHref)} />
    );

  return (
    <>
      <header
        // Header trắng tách khỏi nội dung bằng viền dưới mảnh + bóng đổ nhẹ (mọi trang, kể cả trang chủ — hero trang
        // chủ nền xanh xám nhạt nên header trắng nổi lên, không hoà vào nền).
        className="site-header header-lift sticky z-30 border-b border-line bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
      >
        {/* Không có logo (quyết định của chủ dự án 23/11/2026, khác spec mục 3). Điện thoại (< 768px): một hàng gồm ô
            tìm (kèm nút icon «Lọc nâng cao») và nút menu. Từ 768px: chỉ còn dải menu xanh, ô tìm nằm bên phải dải. */}
        {/* Hàng header điện thoại: nền trắng (trang chủ: chỉ có nút menu cho tới khi ô tìm lớn của hero cuộn khuất). */}
        <div ref={findRef} className="md:hidden">
          <div className="site-wrap flex items-center gap-2 py-2 max-md:pr-2">
            <Link
              href="/"
              aria-label={`${SITE_NAME} – ${M.nav.home}`}
              className="flex h-11 flex-none items-center no-underline"
            >
              <Logo title={SITE_NAME} className="h-[16px] w-auto" />
            </Link>
            <div className="relative flex min-w-0 flex-1 items-center gap-1.5">
              {/* Trang chủ: ô tìm ẩn (vẫn giữ chỗ, nút menu vẫn hiện) cho tới khi ô tìm lớn của hero cuộn khuất. Chỗ
                trống đó hiện lối tắt Tỉnh/thành · Ngành nghề · DN mới (không để một dải trắng chỉ có nút menu). */}
              {!showHeaderSearch && (
                <nav
                  aria-label={M.nav.mainMenu}
                  className="absolute inset-y-0 right-12 left-1 flex items-center gap-4 overflow-x-auto"
                >
                  <a
                    href="#prov-title"
                    className="text-sm font-semibold whitespace-nowrap text-title hover:text-brand"
                  >
                    {M.nav.provinces}
                  </a>
                  <a
                    href="#ind-title"
                    className="text-sm font-semibold whitespace-nowrap text-title hover:text-brand"
                  >
                    {M.nav.industries}
                  </a>
                  <Link
                    href="/doanh-nghiep-moi-thanh-lap"
                    prefetch={false}
                    className="text-sm font-semibold whitespace-nowrap text-title hover:text-brand"
                  >
                    {M.nav.newCompaniesShort}
                  </Link>
                </nav>
              )}
              <div
                data-header-search
                inert={!showHeaderSearch}
                className={`min-w-0 flex-1 ${showHeaderSearch ? '' : 'invisible'}`}
              >
                {search}
              </div>
              <button
                ref={menuBtnRef}
                type="button"
                aria-label={M.nav.openMenu}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 flex-none items-center justify-center rounded text-title hover:bg-silver-2"
              >
                <IconMenu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Hàng menu (≥ 768px), nền trắng: ô «nhà» · Tỉnh/thành · Ngành nghề · DN mới · ô tìm · Lọc nâng cao. Bảng
            thả xuống của Tỉnh/thành và Ngành nghề mở ngay dưới hàng (relative). */}
        <div className="relative hidden md:block">
          <div className="site-wrap flex h-14 items-stretch">
            {/* Logo chữ «TMST» (spec mục 3) — cũng là link về trang chủ, thay ô «nhà». */}
            <Link
              href="/"
              aria-label={`${SITE_NAME} – ${M.nav.home}`}
              aria-current={pathname === '/' ? 'page' : undefined}
              className="mr-5 flex flex-none items-center no-underline"
            >
              <Logo title={SITE_NAME} className="h-[20px] w-auto" />
            </Link>
            <nav aria-label={M.nav.mainMenu} className="flex items-stretch">
              <DesktopDropdown
                id="menu-provinces"
                label={M.nav.provinces}
                open={dropdown === 'provinces'}
                current={pathname.startsWith('/tinh/')}
                onToggle={() => setDropdown((d) => (d === 'provinces' ? null : 'provinces'))}
                onClose={closeDropdown}
              >
                <div className="mb-3 flex items-baseline gap-3">
                  {/* Không dùng h2: bảng nằm trước H1 của trang (sai thứ bậc heading). */}
                  <p className="text-base font-semibold text-ink">{M.nav.provincesHeading}</p>
                </div>
                {/* A–Z theo CỘT dọc (đọc hết cột 1 rồi sang cột 2) — cùng chiều đọc với bảng tỉnh trang chủ. */}
                <ul
                  className="grid auto-cols-fr grid-flow-col grid-rows-[repeat(var(--rows-md),auto)] gap-x-8 lg:grid-rows-[repeat(var(--rows-lg),auto)]"
                  style={{
                    '--rows-md': Math.ceil(sortedProvinces.length / 4),
                    '--rows-lg': Math.ceil(sortedProvinces.length / 6),
                  }}
                >
                  {sortedProvinces.map((p) => (
                    <li key={p.code}>
                      <Link
                        href={`/tinh/${p.slug}`}
                        aria-current={pathname === `/tinh/${p.slug}` ? 'page' : undefined}
                        className={`flex min-h-11 items-center border-b border-line text-base no-underline hover:text-brand-hover ${
                          pathname === `/tinh/${p.slug}` ? 'font-semibold text-brand' : ''
                        }`}
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </DesktopDropdown>
              <DesktopDropdown
                id="menu-industries"
                label={M.nav.industries}
                open={dropdown === 'industries'}
                current={pathname.startsWith('/nganh/')}
                onToggle={() => setDropdown((d) => (d === 'industries' ? null : 'industries'))}
                onClose={closeDropdown}
              >
                <div className="mb-3 flex items-baseline gap-3">
                  <p className="text-base font-semibold text-ink">{M.nav.industriesHeading}</p>
                </div>
                <ul className="grid grid-cols-2 gap-x-12">
                  {industries.map((n) => (
                    <li key={n.code}>
                      <Link
                        href={n.href}
                        className="flex min-h-12 items-center gap-3 border-b border-line py-1 no-underline hover:bg-page"
                      >
                        <IndustryCode code={n.code} />
                        <span className="text-base text-ink">{n.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </DesktopDropdown>
              <Link
                href="/doanh-nghiep-moi-thanh-lap"
                prefetch={false}
                aria-current={pathname === '/doanh-nghiep-moi-thanh-lap' ? 'page' : undefined}
                className={`${NAV_ITEM} ${
                  pathname === '/doanh-nghiep-moi-thanh-lap' ? CURRENT_BAR : ''
                }`}
              >
                {/* Ghi đủ chữ khi đủ chỗ; chỗ hẹp mới rút gọn để ô tìm bên phải không bị bóp. */}
                <span className="lg:hidden">{M.nav.newCompaniesShort}</span>
                <span className="max-lg:hidden xl:hidden">{M.nav.newCompaniesMid}</span>
                <span className="max-xl:hidden">{M.nav.newCompanies}</span>
              </Link>
            </nav>
            {/* Ô tìm bên phải dải menu. Trang chủ: ẩn khi ô tìm lớn của hero còn trong tầm nhìn (vẫn giữ chỗ). */}
            <div
              data-header-search
              inert={!showHeaderSearch}
              className={`ml-auto flex min-w-0 flex-1 items-center justify-end pl-4 ${showHeaderSearch ? '' : 'invisible'}`}
            >
              <div className="w-full max-w-[420px]">{search}</div>
              <span className="ml-4 hidden lg:inline-flex">
                <AdvancedSearchLink
                  href={filterHref}
                  className="nav-item px-1 text-[15px] text-brand hover:text-brand-hover"
                />
              </span>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <MobileMenu
            pathname={pathname}
            provinces={sortedProvinces}
            industries={industries}
            onClose={() => {
              setMobileOpen(false);
              menuBtnRef.current?.focus();
            }}
          />
        )}
      </header>
    </>
  );
}
