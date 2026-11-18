import Link from 'next/link';
import { M } from '@/lib/messages';
import { IllusEmptySearch } from './Illustrations';

export function EmptyState({ title, hints = [], children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white px-6 py-10 text-center">
      <IllusEmptySearch className="w-[140px]" />
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      {hints.length > 0 && (
        <ul className="max-w-md list-disc space-y-1 pl-5 text-left text-body text-ink-2">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

export { default as ErrorState } from './ErrorState';

export function ListSkeleton({ rows = 6 }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-white"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton mt-3 h-4 w-1/2 rounded" />
          <div className="skeleton mt-2 h-4 w-2/3 rounded" />
          <div className="skeleton mt-4 h-6 w-32 rounded-full" />
        </div>
      ))}
      <span className="sr-only">{M.common.loading}</span>
    </div>
  );
}

export function BackHomeLink() {
  return (
    <Link href="/" className="font-semibold">
      {M.notFound.home}
    </Link>
  );
}
