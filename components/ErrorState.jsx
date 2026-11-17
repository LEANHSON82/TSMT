import { M } from '@/lib/messages';
import { IconAlert } from './Icons';

// Tách khỏi States.jsx: app/error.js (tải ở mọi trang) chỉ cần khối này, không kéo theo hình minh hoạ.
export default function ErrorState({
  onRetry,
  title = M.list.errorTitle,
  hint = M.list.errorHint,
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white px-6 py-10 text-center"
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
        <IconAlert size={26} />
      </span>
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="text-body text-ink-2">{hint}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 h-11 rounded-md bg-brand px-6 text-body font-semibold text-white hover:bg-brand-hover"
        >
          {M.list.retry}
        </button>
      )}
    </div>
  );
}
