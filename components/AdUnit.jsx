'use client';

// Phần tử giữ chỗ của một ô quảng cáo. Với NEXT_PUBLIC_AD_PROVIDER=gpt: khi ô sắp vào màn hình (cách 200px)
// thì mới nạp GPT và đổ banner (spec 5.2); rời trang thì huỷ slot. mock / fallback: chỉ là khung xám.
// size: 'inline' → 728×90 nếu khung đủ 728px, không thì 300×250 (đo lúc đổ, khớp container query của AdSlot);
//       'rail' → 300×600; 'fallback' → 336×280 hoặc 300×250 (modal quảng cáo dự phòng).
import { useEffect, useRef } from 'react';
import { AD_PROVIDER, renderBanner } from '@/lib/ads';

function pickSizes(size, el) {
  if (size === 'rail') return [300, 600];
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
        renderBanner(slotId, el, { sizes: pickSizes(size, el) })
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
