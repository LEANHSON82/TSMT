import { M } from '@/lib/messages';
import AdUnit from './AdUnit';

// Ô banner quảng cáo (spec mục 5.4). Là <div> thường, không phải landmark <aside> (nhiều ô cùng tên gây
// rối khi nhảy theo landmark); nhãn «Quảng cáo» vẫn nhìn thấy được. Giữ chỗ trước bằng min-height đúng kích thước + nhãn «Quảng cáo»
// để trang không nhảy khi quảng cáo tải (CLS). Với NEXT_PUBLIC_AD_PROVIDER=gpt, AdUnit đổ banner Google Ad
// Manager vào phần tử có data-ad-slot khi ô sắp vào màn hình; còn lại là khung giả lập.
//   variant="inline": điện thoại 300×250, máy tính 728×90
//   variant="rail":   chỉ máy tính, 300×600, dính khi cuộn
export default function AdSlot({ slotId, variant = 'inline', className = '' }) {
  if (variant === 'rail') {
    return (
      <div data-ad-wrap className={`hidden lg:block ${className}`}>
        <div className="sticky top-[96px] flex flex-col gap-1">
          <span className="text-xs tracking-wide text-muted uppercase">{M.ad.label}</span>
          <AdUnit
            slotId={slotId}
            size="rail"
            data-ad-size="300x600"
            className="flex h-[600px] w-[300px] justify-center overflow-hidden rounded-lg bg-ad"
          />
        </div>
      </div>
    );
  }
  return (
    // Container query: chỉ đổi sang 728×90 khi khung chứa đủ 728px (cột chính trang DN ở 1024px hẹp hơn),
    // banner thật không bị ép / tràn ngang.
    <div data-ad-wrap className={`@container flex flex-col items-center ${className}`}>
      <div className="flex w-[300px] max-w-full flex-col gap-1 @min-[728px]:w-[728px]">
        <span className="text-xs tracking-wide text-muted uppercase">{M.ad.label}</span>
        <AdUnit
          slotId={slotId}
          data-ad-size="300x250,728x90"
          className="flex h-[250px] w-full justify-center overflow-hidden rounded-lg bg-ad @min-[728px]:h-[90px]"
        />
      </div>
    </div>
  );
}
