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
import { buildHref } from '@/lib/url';
import IndustryCode from './IndustryCode';
import { trapTab } from './focusTrap';
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
      className={`inline-flex min-h-11 items-center gap-2 font-semibold whitespace-nowrap no-underline hover:underline hover:underline-offset-[3px] ${className}`}
    >
      <FilterIcon />
      {M.list.advancedFilter}
    </Link>
  );
}

// Điện thoại: cùng lối vào nhưng chỉ icon, rộng 44px, cao bằng ô tìm (48px), viền như ô nhập. Tên đọc + tooltip
// = «Lọc nâng cao».
function AdvancedSearchIcon({ href, className = '' }) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={M.list.advancedFilter}
      title={M.list.advancedFilter}
      className={`inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border border-field bg-white text-brand no-underline hover:border-ink-2 ${className}`}
    >
      <FilterIcon size={20} />
    </Link>
  );
}

// Mục menu hàng 1: chữ 16px đậm; mục của trang đang xem màu xanh + vạch 2px sát đáy vùng bấm.
// Dải menu navy kiểu CafeF: chữ trắng in hoa 13px; mục của trang đang xem có vạch cam 3px sát đáy.
const NAV_ITEM =
  'inline-flex h-11 items-center gap-1 px-4 text-[13px] tracking-[0.02em] whitespace-nowrap text-white uppercase no-underline hover:bg-white/10 hover:text-white';
const CURRENT_BAR = 'font-semibold shadow-[inset_0_-3px_0_#f5a623]';

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
          current ? CURRENT_BAR : open ? 'bg-white/10' : ''
        }`}
      >
        {label}
        <IconChevronDown
          size={16}
          strokeWidth={1.6}
          className={`text-white/70 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
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
            <p className="px-4 pt-3 pb-2 text-meta text-muted">
              {sub === 'provinces'
                ? M.nav.provincesNote(provinces.length)
                : M.nav.industriesSubNote}
            </p>
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
  const sortedProvinces = [...provinces].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
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
        className={`site-header header-lift sticky z-30 bg-white ${
          // Trang chủ: viền dưới nằm ở cuối hero.
          isHome ? '' : 'border-b border-line'
        }`}
      >
        {/* Không có logo (quyết định của chủ dự án 23/11/2026, khác spec mục 3). Điện thoại (< 768px): một hàng gồm ô
            tìm (kèm nút icon «Lọc nâng cao») và nút menu. Từ 768px: chỉ còn dải menu xanh, ô tìm nằm bên phải dải. */}
        <div ref={findRef} className="md:hidden">
          <div className="site-wrap flex items-center gap-1.5 py-2 max-md:pr-2">
            {/* Trang chủ: ô tìm ẩn (vẫn giữ chỗ, nút menu vẫn hiện) cho tới khi ô tìm lớn của hero cuộn khuất. */}
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
              className="inline-flex h-11 w-11 flex-none items-center justify-center rounded text-ink"
            >
              <IconMenu size={24} />
            </button>
          </div>
        </div>

        {/* Dải menu navy (≥ 768px), kiểu CafeF: ô «nhà» · Tỉnh/thành · Ngành nghề · DN mới · Yêu cầu ẩn/sửa. Bảng
            thả xuống của Tỉnh/thành và Ngành nghề mở ngay dưới dải (relative). */}
        <div className="relative hidden bg-brand md:block">
          <div className="site-wrap flex h-11 items-stretch">
            <Link
              href="/"
              aria-label={M.nav.home}
              aria-current={pathname === '/' ? 'page' : undefined}
              className="flex w-11 flex-none items-center justify-center bg-[#0a3f86] text-white hover:bg-[#0a3a7e] hover:text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 11 12 4l9 7" />
                <path d="M5 10v10h14V10" />
              </svg>
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
                  <span className="text-meta text-muted">
                    {M.nav.provincesNote(provinces.length)}
                  </span>
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
                        className={`flex min-h-11 items-center border-b border-line text-base no-underline hover:underline hover:underline-offset-[3px] ${
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
                  <span className="text-meta text-muted">{M.nav.industriesNote}</span>
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
                aria-current={pathname === '/doanh-nghiep-moi-thanh-lap' ? 'page' : undefined}
                className={`${NAV_ITEM} ${
                  pathname === '/doanh-nghiep-moi-thanh-lap' ? CURRENT_BAR : ''
                }`}
              >
                {M.nav.newCompaniesShort}
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
                  className="text-[13px] text-white hover:text-white [&>svg]:text-white/80"
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
