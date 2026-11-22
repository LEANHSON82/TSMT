import { BANNERS_ON } from '@/components/AdSlot';
import { M } from '@/lib/messages';

// Khung chờ trang DN: cùng bố cục trang thật (dải xanh, khối đầu trang tên DN + bảng thông tin, rồi các thẻ) để
// khi dữ liệu về trang không xô lệch.
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{M.common.loading}</span>
      <div className="bg-band pb-8 md:pb-12">
        <div className="site-wrap">
          <div className="flex h-12 items-center md:h-14">
            <div className="h-4 w-56 max-w-full rounded-sm bg-white/30" />
          </div>
          <div className="card-hero px-5 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6 xl:flex xl:items-center xl:gap-12">
            <div className="flex flex-col items-center gap-3 xl:w-[340px] xl:flex-none">
              <div className="skeleton h-8 w-4/5 rounded-sm md:h-10" />
              <div className="skeleton h-8 w-3/5 rounded-sm md:h-10" />
              <div className="skeleton h-5 w-2/3 rounded-sm" />
            </div>
            <div className="mt-5 flex min-w-0 flex-1 flex-col gap-3 border-t border-line pt-4 xl:mt-0 xl:border-t-0 xl:pt-0">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-1 md:grid-cols-[150px_minmax(0,1fr)] md:gap-x-4"
                >
                  <div className="skeleton h-4 w-24 rounded-sm" />
                  <div
                    className="skeleton h-5 rounded-sm"
                    style={{ width: `${55 + ((i * 17) % 40)}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={`site-wrap mt-8 pb-12 ${BANNERS_ON ? 'rail-grid' : ''}`}>
        <div className="card h-48" />
        {BANNERS_ON && <div className="skeleton hidden h-[624px] xl:block" />}
      </div>
    </div>
  );
}
