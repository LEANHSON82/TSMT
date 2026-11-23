import { M } from '@/lib/messages';
import AdUnit from './AdUnit';

// Ô banner quảng cáo (spec mục 5.4). Là <div> thường, không phải landmark <aside> (nhiều ô cùng tên gây
// rối khi nhảy theo landmark); nhãn «Quảng cáo» vẫn nhìn thấy được. Giữ chỗ trước bằng min-height đúng kích thước + nhãn «Quảng cáo»
// để trang không nhảy khi quảng cáo tải (CLS). Với NEXT_PUBLIC_AD_PROVIDER=gpt, AdUnit đổ banner Google Ad
// Manager vào phần tử có data-ad-slot khi ô sắp vào màn hình; còn lại là khung giả lập.
//   variant="inline": điện thoại 300×250, máy tính 728×90
//   variant="rail":   chỉ máy tính, 300×600, dính khi cuộn
// Có nguồn banner thật không: gpt + đã khai ad unit banner (owner tạo trên Ad Manager), hoặc mock (dev/test,
// để thấy chỗ đặt ô). fallback / gpt chưa có ad unit: không vẽ ô — một khung xám trống mãi trông như trang lỗi.
const provider = process.env.NEXT_PUBLIC_AD_PROVIDER;
export const BANNERS_ON =
  provider === 'gpt' ? Boolean(process.env.NEXT_PUBLIC_GPT_BANNER_PATH) : provider !== 'fallback';

// Kiểu Pappers: nhãn «Quảng cáo» 12px xám căn giữa trên ô; ô nền xám, không bo góc, không viền — khác hẳn thẻ
// trắng nội dung; cột phải là ô 300×600 trơn, dính khi cuộn (dưới hàng ô tìm dính).
export default function AdSlot({ slotId, variant = 'inline', className = '' }) {
  if (!BANNERS_ON) return null;
  if (variant === 'rail') {
    return (
      <div data-ad-wrap className={`hidden lg:block ${className}`}>
        {/* Dính ngay dưới header (cao 56px) + khe 16px. */}
        <div className="sticky top-[72px] flex flex-col gap-1">
          <span className="text-xs leading-4 text-muted">{M.ad.label}</span>
          <AdUnit
            slotId={slotId}
            size="rail"
            data-ad-size="300x600"
            className="flex h-[600px] w-[300px] justify-center overflow-hidden bg-ad"
          />
        </div>
      </div>
    );
  }
  return (
    <div data-ad-wrap className={`flex flex-col items-center gap-1 ${className}`}>
      <span className="text-xs leading-4 text-muted">{M.ad.label}</span>
      {/* Container query trên khung: chỉ đổi sang 728×90 khi lòng khung đủ 728px (cột chính trang DN ở 1024px
          hẹp hơn), banner thật không bị ép / tràn ngang. AdUnit rộng đúng cỡ banner nên clientWidth (AdUnit
          dùng để chọn cỡ khi đổ GPT) khớp với khung giữ chỗ. */}
      <div className="@container flex w-full justify-center">
        <AdUnit
          slotId={slotId}
          data-ad-size="300x250,728x90"
          className="flex h-[250px] w-[300px] max-w-full justify-center overflow-hidden bg-ad @min-[728px]:h-[90px] @min-[728px]:w-[728px]"
        />
      </div>
    </div>
  );
}
