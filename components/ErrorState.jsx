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
      className={`card flex flex-col items-start px-5 py-5 md:px-8 md:py-7 ${page ? 'max-w-[760px]' : ''}`}
    >
      <Tag
        className={`font-semibold text-pretty text-ink ${page ? 'text-h1-m md:text-h1' : 'text-[18px] leading-7'}`}
      >
        {title}
      </Tag>
      <p className="mt-2 max-w-[680px] text-body leading-7 text-pretty text-ink-2">{hint}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 h-11 rounded-lg bg-brand px-5 text-base font-semibold text-white hover:bg-cta-hover active:bg-chrome-2"
        >
          {M.list.retry}
        </button>
      )}
    </div>
  );
}
