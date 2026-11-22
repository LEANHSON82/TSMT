import { ListSkeleton } from './States';

// Khung chờ trang danh sách: cùng bố cục ListPageShell (breadcrumb, khung tiêu đề, thanh số đếm, khung danh sách).
export default function ListLoading() {
  return (
    <main className="site-wrap pb-12">
      <div className="skeleton mt-3 h-4 w-48 rounded-sm md:mt-4" />
      <div className="card mt-2 flex flex-col gap-2 px-4 py-4 md:mt-3 md:px-6 md:py-5">
        <div className="skeleton h-7 w-2/3 rounded-sm md:h-8 md:w-1/2" />
        <span className="skeleton h-4 w-full max-w-[760px] rounded-sm" />
      </div>
      <div className="flex h-11 items-center pt-3 md:pt-4">
        <div className="skeleton h-4 w-52 rounded-sm" />
      </div>
      <div className="mt-3">
        <ListSkeleton rows={8} />
      </div>
    </main>
  );
}
