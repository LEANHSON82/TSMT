import { BANNERS_ON } from '@/components/AdSlot';
import { M } from '@/lib/messages';

// Khung chờ trang DN: cùng bố cục trang thật (khung tên DN, khung thông tin có tab, rồi các khung dưới) để khi dữ
// liệu về trang không xô lệch.
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="site-wrap pb-12">
      <span className="sr-only">{M.common.loading}</span>
      <div className="flex h-8 items-center pt-3 md:pt-4">
        <div className="skeleton h-4 w-56 max-w-full rounded-sm" />
      </div>
      <div className="card mt-2 flex flex-col gap-2 px-4 py-4 md:mt-3 md:px-6 md:py-5">
        <div className="skeleton h-7 w-4/5 rounded-sm md:h-8" />
        <div className="skeleton h-4 w-1/2 rounded-sm" />
      </div>
      <div className="panel mt-3 md:mt-4">
        <div className="h-11 w-56 bg-brand md:h-[50px]" />
        <div className="flex flex-col px-4 md:px-[22px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-1 border-b border-line-soft py-3 last:border-b-0 md:grid-cols-[200px_minmax(0,1fr)] md:gap-x-4"
            >
              <div className="skeleton h-4 w-28 rounded-sm" />
              <div
                className="skeleton h-5 rounded-sm"
                style={{ width: `${55 + ((i * 17) % 40)}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={`mt-5 ${BANNERS_ON ? 'rail-grid' : ''}`}>
        <div className="panel h-48" />
        {BANNERS_ON && <div className="skeleton hidden h-[624px] xl:block" />}
      </div>
    </div>
  );
}
