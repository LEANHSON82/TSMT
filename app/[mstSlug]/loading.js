// Khung chờ khi mở trang DN chưa có sẵn trong bộ đệm (vd. bấm gợi ý tìm kiếm): hiện ngay bố cục trang
// (dải tiêu đề, bảng thông tin, cột quảng cáo) thay vì đứng yên ở trang cũ. Trang đã prerender thì không thấy.
import { M } from '@/lib/messages';

export default function CompanyLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex w-full flex-col">
      <span className="sr-only">{M.common.loading}</span>
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pt-4 pb-5 md:px-6 md:pt-6 md:pb-7">
          <div className="skeleton h-4 w-56 max-w-full rounded" />
          <div className="skeleton h-8 w-full max-w-[560px] rounded" />
          <div className="skeleton h-4 w-2/3 max-w-[420px] rounded" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 pt-6 pb-12 md:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col divide-y divide-line-soft rounded-xl border border-line bg-white">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 md:px-5">
              <div className="skeleton h-4 w-24 flex-none rounded md:w-32" />
              <div
                className="skeleton h-4 flex-1 rounded"
                style={{ maxWidth: `${50 + ((i * 17) % 40)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="skeleton hidden h-[600px] rounded-xl lg:block" />
      </div>
    </div>
  );
}
