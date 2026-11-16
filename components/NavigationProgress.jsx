'use client';

// Phản hồi khi chuyển trang (App Router không có sự kiện router): bấm link nội bộ hoặc component phát
// sự kiện NAV_START (bộ lọc, ô tìm) → gắn html[data-navigating] → CSS hiện thanh tiến độ mảnh ở mép
// trên và làm mờ danh sách ([data-list-content]). Trang mới (pathname/query đổi) thì gỡ.
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export const NAV_START = 'app:navigate-start';
const SAFETY_MS = 15000; // không bao giờ treo thanh tiến độ nếu điều hướng bị huỷ
// Router của Next 15.5 thỉnh thoảng bỏ qua chuyển trang giữa hai URL cùng đường dẫn, chỉ khác tham số
// (vd. /tim-kiem?q=a → /tim-kiem?q=a&theo=dai-dien): đã nhận đủ dữ liệu trang mới (200) nhưng không áp dụng,
// không báo lỗi. Gặp nhiều hơn khi API phản hồi chậm. Chưa tìm ra nguyên nhân gốc → quá FALLBACK_MS mà URL
// vẫn chưa đổi thì tải trang thường (cùng cách với ListFilters).
const FALLBACK_MS = 2500;
const urlKey = (u) => `${u.pathname}?${[...u.searchParams].sort().join('&')}`;

function setNavigating(on) {
  const el = document.documentElement;
  if (on) el.setAttribute('data-navigating', '');
  else el.removeAttribute('data-navigating');
}

export function startNavigation() {
  window.dispatchEvent(new Event(NAV_START));
}

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => setNavigating(false), [pathname, searchParams]);

  // Chuyển trang (đổi đường dẫn): nội dung trang mới hiện mờ dần + trượt lên nhẹ (.page-enter trên #main).
  // Bỏ qua lần tải đầu (không làm chậm LCP); đổi trang/bộ lọc trong cùng danh sách không chạy.
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    const main = document.getElementById('main');
    if (!main) return;
    main.classList.remove('page-enter');
    void main.offsetWidth; // khởi động lại animation
    main.classList.add('page-enter');
  }, [pathname]);

  useEffect(() => {
    let timer;
    const start = () => {
      setNavigating(true);
      clearTimeout(timer);
      timer = setTimeout(() => setNavigating(false), SAFETY_MS);
    };
    // Không bắt popstate (Back/Forward): sự kiện đến sau khi trang đã đổi nên sẽ kẹt thanh tiến độ;
    // Back thường tức thì vì trang có sẵn trong cache.
    // Pha capture: next/link gọi preventDefault ở pha bubble nên không dựa vào defaultPrevented.
    let fallback;
    const onClick = (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      clearTimeout(fallback); // bấm link khác thì bỏ dự phòng của lần bấm trước
      start();
      if (url.pathname === window.location.pathname) {
        fallback = setTimeout(() => {
          const now = new URL(window.location.href);
          if (now.pathname === url.pathname && urlKey(now) !== urlKey(url))
            window.location.assign(url.href);
        }, FALLBACK_MS);
      }
    };
    // Back/Forward trong lúc chờ: người dùng đã đổi ý, không tự chuyển nữa.
    const cancelFallback = () => clearTimeout(fallback);
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', cancelFallback);
    window.addEventListener(NAV_START, start);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', cancelFallback);
      window.removeEventListener(NAV_START, start);
    };
  }, []);

  return <div aria-hidden="true" className="nav-progress" />;
}
