import { ListSkeleton } from './States';

// Khung chờ trang danh sách: cùng bố cục ListPageShell (phần đầu nền trắng: breadcrumb, H1, mô tả; rồi các thẻ DN
// trên nền xám) để khi trang thật hiện ra các khối không xô lệch.
export default function ListLoading() {
  return (
    <main className="flex flex-col">
      <div className="border-b border-line bg-white">
        <div className="site-wrap pb-5 md:pb-6">
          <div className="skeleton mt-3 h-5 w-48 rounded-sm md:mt-4" />
          <div className="skeleton mt-3 h-[30px] w-2/3 rounded-sm md:h-10 md:w-1/2" />
          <div aria-hidden="true" className="mt-3 flex max-w-[760px] flex-col gap-2">
            <span className="skeleton h-4 w-full rounded-sm" />
            <span className="skeleton h-4 w-3/5 rounded-sm" />
          </div>
        </div>
      </div>
      <div className="site-wrap pb-12">
        <div className="flex h-11 items-center pt-4 pb-3 md:pt-6">
          <div className="skeleton h-4 w-52 rounded-sm" />
        </div>
        <div className="mt-4">
          <ListSkeleton rows={8} />
        </div>
      </div>
    </main>
  );
}
