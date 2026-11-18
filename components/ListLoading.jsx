import { ListSkeleton } from './States';

// Khung chờ trang danh sách: cùng bố cục ListPageShell (dải tiêu đề trắng + danh sách trên nền xám).
export default function ListLoading() {
  return (
    <main className="flex w-full flex-col">
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pt-4 pb-5 md:px-6 md:pt-6 md:pb-7">
          <div className="h-4 w-48 skeleton rounded" />
          <div className="h-8 w-2/3 skeleton rounded" />
          <div className="h-4 w-40 skeleton rounded" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 pt-5 pb-12 md:px-6 md:pt-6">
        <ListSkeleton rows={6} />
      </div>
    </main>
  );
}
