// Khung chờ khi mở trang DN chưa có sẵn trong bộ đệm (vd. bấm gợi ý tìm kiếm): hiện ngay bố cục trang
// (breadcrumb, tiêu đề, bảng thông tin kiểu A, cột quảng cáo) thay vì đứng yên ở trang cũ. Cùng lưới, cùng
// khoảng cách với page.js để khi nội dung thật thay vào không bị nhảy. Trang đã prerender thì không thấy.
import { BANNERS_ON } from '@/components/AdSlot';
import { M } from '@/lib/messages';

export default function CompanyLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="site-wrap">
      <span className="sr-only">{M.common.loading}</span>
      <div className="pt-3 md:pt-5">
        <div className="skeleton h-5 w-56 max-w-full rounded-sm" />
      </div>
      <div className={`mt-3 md:mt-4 ${BANNERS_ON ? 'rail-grid' : ''}`}>
        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-2 md:mb-8">
            <div className="skeleton h-[30px] w-full max-w-[560px] rounded-sm md:h-9" />
            <div className="skeleton h-5 w-2/3 rounded-sm" />
          </div>
          {/* Như SectionHeader: vạch 2px + tiêu đề. */}
          <div className="border-t-2 border-ink pt-3 pb-2">
            <div className="skeleton h-7 w-48 rounded-sm" />
          </div>
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-2.5 border-b border-line py-2 md:grid-cols-[208px_minmax(0,1fr)] md:gap-x-4 md:py-3.5"
              >
                <div className="skeleton h-5 w-20 rounded-sm md:h-6 md:w-28" />
                <div
                  className="skeleton h-6 rounded-sm"
                  style={{ width: `${50 + ((i * 17) % 40)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        {BANNERS_ON && <div className="skeleton hidden h-[624px] xl:block" />}
      </div>
    </div>
  );
}
