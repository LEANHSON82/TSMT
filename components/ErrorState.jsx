import { M } from '@/lib/messages';

// Tách khỏi States.jsx: app/error.js (tải ở mọi trang) chỉ cần khối này, không kéo theo hình minh hoạ.
// Hệ A: căn trái, không hộp, không icon tròn. as="h1" khi là cả trang lỗi (app/error.js); mặc định là một khối
// trong trang (h2) → mở đầu bằng vạch 2px như mọi khối khác. Cả trang lỗi: khung rộng đúng cột chính 852 như
// trang 404 (không lửng ở mép 640 lạc lưới), riêng câu chữ giữ ~75 ký tự/dòng.
export default function ErrorState({
  onRetry,
  title = M.list.errorTitle,
  hint = M.list.errorHint,
  as: Tag = 'h2',
}) {
  const page = Tag === 'h1';
  return (
    <div
      role="alert"
      className={`flex flex-col items-start ${page ? 'max-w-[852px]' : 'max-w-[640px] border-t-2 border-ink pt-3'}`}
    >
      <Tag
        className={`font-semibold text-pretty text-ink ${page ? 'text-h1-m md:text-h1' : 'text-h2-m md:text-h2'}`}
      >
        {title}
      </Tag>
      <p className="mt-2 max-w-[680px] text-body leading-7 text-pretty text-ink-2">{hint}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 h-12 rounded bg-brand px-6 text-base font-semibold text-white hover:bg-brand-hover"
        >
          {M.list.retry}
        </button>
      )}
    </div>
  );
}
