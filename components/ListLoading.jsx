import { ListSkeleton } from './States';

// Khung chờ trang danh sách: cùng nhịp với ListPageShell (breadcrumb, H1, mô tả, thanh công cụ 44px, bảng) để khi
// trang thật hiện ra các khối không xô lệch. Mô tả (16/24, rộng tối đa 852) giữ đúng số dòng thường gặp của
// trang thật: điện thoại 3 dòng, 768–1023 2 dòng, ≥ 1024 1 dòng.
export default function ListLoading() {
  const line = 'flex h-6 items-center';
  return (
    <main className="site-wrap">
      <div className="skeleton mt-3 h-5 w-48 rounded-sm md:mt-5" />
      <div className="skeleton mt-3 h-[30px] w-2/3 rounded-sm md:mt-4 md:h-9 md:w-1/2" />
      <div aria-hidden="true" className="mt-2 flex max-w-[852px] flex-col">
        <span className={line}>
          <span className="skeleton h-4 w-full rounded-sm lg:w-4/5" />
        </span>
        <span className={`${line} lg:hidden`}>
          <span className="skeleton h-4 w-full rounded-sm md:w-3/5" />
        </span>
        <span className={`${line} md:hidden`}>
          <span className="skeleton h-4 w-2/3 rounded-sm" />
        </span>
      </div>
      <div className="mt-5 box-content flex h-11 items-center pb-4 md:mt-8">
        <div className="skeleton h-5 w-52 rounded-sm" />
      </div>
      <ListSkeleton rows={8} />
    </main>
  );
}
