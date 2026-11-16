'use client';

// Phản hồi khi chuyển trang (App Router không có sự kiện router): bấm link nội bộ hoặc component phát
// sự kiện NAV_START (bộ lọc, ô tìm) → gắn html[data-navigating] → CSS hiện thanh tiến độ mảnh ở mép
// trên và làm mờ danh sách ([data-list-content]). Trang mới (pathname/query đổi) thì gỡ.
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export const NAV_START = 'app:navigate-start';
const SAFETY_MS = 15000; // không bao giờ treo thanh tiến độ nếu điều hướng bị huỷ

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
    const onClick = (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      start();
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener(NAV_START, start);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener(NAV_START, start);
    };
  }, []);

  return <div aria-hidden="true" className="nav-progress" />;
}
