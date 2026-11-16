import Link from 'next/link';
import { M } from '@/lib/messages';
import { IconAlert } from './Icons';
import { IllusEmptySearch } from './Illustrations';

export function EmptyState({ title, hints = [], children }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white px-6 py-10 text-center">
      <IllusEmptySearch className="w-[140px]" />
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      {hints.length > 0 && (
        <ul className="max-w-md list-disc space-y-1 pl-5 text-left text-[15px] text-ink-2">
          {hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

export function ErrorState({ onRetry, title = M.list.errorTitle, hint = M.list.errorHint }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white px-6 py-10 text-center"
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
        <IconAlert size={26} />
      </span>
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="text-[15px] text-ink-2">{hint}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 h-11 rounded-md bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-hover"
        >
          {M.list.retry}
        </button>
      )}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }) {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">{M.common.loading}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-white p-4">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton mt-3 h-4 w-1/2 rounded" />
          <div className="skeleton mt-2 h-4 w-2/3 rounded" />
          <div className="skeleton mt-4 h-6 w-32 rounded-full" />
        </div>
      ))}
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
