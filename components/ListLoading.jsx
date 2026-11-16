import { ListSkeleton } from './States';

export default function ListLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 pt-4 pb-12 md:px-6 md:pt-6">
      <div className="h-4 w-48 skeleton rounded" />
      <div className="h-8 w-2/3 skeleton rounded" />
      <div className="h-4 w-40 skeleton rounded" />
      <ListSkeleton rows={6} />
    </main>
  );
}
