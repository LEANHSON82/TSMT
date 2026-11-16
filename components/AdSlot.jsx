import { M } from '@/lib/messages';

// Ô banner quảng cáo (spec mục 5.4). Giữ chỗ trước bằng min-height đúng kích thước + nhãn «Quảng cáo»
// để trang không nhảy khi quảng cáo tải (CLS). Hiện là khung giả lập; khi có Google Ad Manager,
// lib/ads renderBanner(slotId, el) sẽ đổ quảng cáo thật vào phần tử có data-ad-slot.
//   variant="inline": điện thoại 300×250, máy tính 728×90
//   variant="rail":   chỉ máy tính, 300×600, dính khi cuộn
export default function AdSlot({ slotId, variant = 'inline', className = '' }) {
  if (variant === 'rail') {
    return (
      <aside aria-label={M.ad.label} className={`hidden lg:block ${className}`}>
        <div className="sticky top-[96px] flex flex-col gap-1">
          <span className="text-[11px] tracking-wide text-muted uppercase">{M.ad.label}</span>
          <div
            data-ad-slot={slotId}
            data-ad-size="300x600"
            className="h-[600px] w-[300px] rounded-lg bg-ad"
          />
        </div>
      </aside>
    );
  }
  return (
    <aside aria-label={M.ad.label} className={`flex flex-col items-center ${className}`}>
      <div className="flex w-[300px] max-w-full flex-col gap-1 md:w-[728px]">
        <span className="text-[11px] tracking-wide text-muted uppercase">{M.ad.label}</span>
        <div
          data-ad-slot={slotId}
          data-ad-size="300x250,728x90"
          className="h-[250px] w-full rounded-lg bg-ad md:h-[90px]"
        />
      </div>
    </aside>
  );
}
