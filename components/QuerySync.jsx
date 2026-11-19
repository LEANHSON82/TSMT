'use client';

// Giữ nội dung trang /tim-kiem khớp URL khi bấm Back/Forward (và khi router.push đổi tham số).
// Router của Next 15.5 (trang động) thỉnh thoảng đổi URL + useSearchParams sang URL mới, đã tải xong dữ liệu
// trang mới nhưng KHÔNG áp dụng: H1 «– Trang 2», «Hiển thị 21–25», ô chọn… vẫn của URL cũ (xem chú thích trong
// NavigationProgress.jsx). Trang truyền vào đúng bộ tham số server đã render; lệch với location.search quá
// CHECK_MS → router.refresh() (router đã ở URL mới nên tải lại đúng trang), lệch tiếp → refresh lần 2 sau
// RETRY_MS; vẫn lệch sau RELOAD_MS → tải trang thường. Đo trên bản build (Back sau trang 2, 1440px): lỗi gặp
// ~1/2 số lần; refresh lần 1 sửa được ~70%, lần 2 thêm ~10%, còn lại phải tải lại.
// Trong lúc chờ hiện thanh tiến độ + làm mờ danh sách để không ai đọc nhầm nội dung cũ.
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { endNavigation, startNavigation } from './NavigationProgress';

const CHECK_MS = 300;
const RETRY_MS = 500;
const RELOAD_MS = 1200;

const byKey = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);
const keyOf = (entries) =>
  entries
    .filter(([, v]) => v !== '')
    .sort(byKey)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
/** searchParams của server ({ q: 'a', tinh: ['x', 'y'] }) → chuỗi so sánh được. */
const renderedKey = (params) =>
  keyOf(
    Object.entries(params || {}).flatMap(([k, v]) =>
      (Array.isArray(v) ? v : [v]).map((x) => [k, String(x ?? '')]),
    ),
  );
const locationKey = () => keyOf([...new URLSearchParams(window.location.search)]);

export default function QuerySync({ params }) {
  const router = useRouter();
  const hookKey = useSearchParams().toString(); // đổi khi router đổi URL (kể cả lúc không áp dụng trang)
  const rendered = renderedKey(params);
  const renderedRef = useRef(rendered);
  const timers = useRef([]);
  const waiting = useRef(false);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Trang mới đã render (khớp URL): huỷ hẹn giờ, tắt thanh tiến độ nếu chính component này bật.
  useEffect(() => {
    renderedRef.current = rendered;
    if (rendered === locationKey()) {
      clear();
      if (waiting.current) endNavigation();
      waiting.current = false;
    }
  }, [rendered]);

  // Đường dẫn lúc trang này render (/tim-kiem). Back sang đường dẫn khác là việc của router, không can thiệp.
  const pathRef = useRef('');
  useEffect(() => {
    pathRef.current = window.location.pathname;
  }, []);

  useEffect(() => {
    const stale = () =>
      window.location.pathname === pathRef.current && renderedRef.current !== locationKey();
    const check = () => {
      clear();
      timers.current.push(
        setTimeout(() => {
          if (!stale()) return;
          waiting.current = true;
          startNavigation();
          router.refresh();
          timers.current.push(
            setTimeout(() => stale() && router.refresh(), RETRY_MS),
            setTimeout(() => stale() && window.location.reload(), RELOAD_MS),
          );
        }, CHECK_MS),
      );
    };
    check(); // khi mount và mỗi lần router đổi tham số
    window.addEventListener('popstate', check);
    return () => {
      clear();
      window.removeEventListener('popstate', check);
    };
  }, [router, hookKey]);

  return null;
}
