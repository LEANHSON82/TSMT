'use client';

// Phần tử giữ chỗ của một ô quảng cáo. Với NEXT_PUBLIC_AD_PROVIDER=gpt: khi ô sắp vào màn hình (cách 200px)
// thì mới nạp GPT và đổ banner (spec 5.2); rời trang thì huỷ slot. mock / fallback: chỉ là khung xám.
// size: 'inline' → 728×90 nếu khung đủ 728px, không thì 300×250 (đo lúc đổ, khớp container query của AdSlot);
//       'rail' → 300×600 (hoặc 300×250); 'fallback' → 336×280 hoặc 300×250 (modal quảng cáo dự phòng).
import { useEffect, useRef } from 'react';
import { AD_PROVIDER, renderBanner } from '@/lib/ads';

function pickSizes(size, el) {
  // Cột phải: ưu tiên 300×600, nhận thêm 300×250 để luôn có quảng cáo (tăng tỉ lệ lấp đầy). Cùng rộng 300px nên
  // khung chỉ cần co chiều cao theo quảng cáo (onRender), không thừa mảng xám hai bên.
  if (size === 'rail')
    return [
      [300, 600],
      [300, 250],
    ];
  if (size === 'fallback')
    return el.clientWidth >= 336
      ? [
          [336, 280],
          [300, 250],
        ]
      : [[300, 250]];
  return el.clientWidth >= 728 ? [728, 90] : [300, 250];
}

export default function AdUnit({ slotId, size = 'inline', className = '', ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    if (AD_PROVIDER !== 'gpt') return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    let cancelled = false;
    let destroy;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        // Cột phải: Google trả cỡ nhỏ hơn 300×600 → khung co theo quảng cáo, không để thừa mảng xám.
        // Chỉ cột phải (cột riêng, co lại không xô nội dung chính); ô trong bài đã đúng cỡ sẵn.
        const onRender = size === 'rail' ? ([, h]) => (el.style.height = `${h}px`) : undefined;
        // Không có quảng cáo: ô còn nằm dưới màn hình (người dùng chưa thấy) thì gỡ cả khung + nhãn, không để
        // mảng xám — co lại ngoài màn hình không làm xô nội dung đang xem (CLS). Ô đã trong màn hình thì giữ
        // nguyên khung giữ chỗ (spec 5.4). Cột phải: luôn gỡ được (cột riêng).
        const onEmpty = () => {
          const wrap = el.closest('[data-ad-wrap]');
          if (!wrap) return;
          if (size === 'rail' || el.getBoundingClientRect().top > window.innerHeight)
            wrap.hidden = true;
        };
        renderBanner(slotId, el, { sizes: pickSizes(size, el), onRender, onEmpty })
          .then((fn) => (cancelled ? fn?.() : (destroy = fn)))
          .catch(() => {
            /* bị chặn / lỗi mạng: giữ khung giữ chỗ */
          });
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      destroy?.();
    };
  }, [slotId, size]);

  return <div ref={ref} data-ad-slot={slotId} className={className} {...rest} />;
}
