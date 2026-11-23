'use client';

// Lỗi ở chính layout gốc (vd. API danh mục tỉnh/thành không trả lời khi trang được tạo lần đầu): layout không dựng
// được nên trang này tự có <html>/<body>. Giữ tối giản: câu thông báo + nút tải lại (spec mục 3: trạng thái lỗi).
import './globals.css';
import { M } from '@/lib/messages';

export default function GlobalError() {
  return (
    <html lang="vi">
      <body className="bg-page font-sans text-ink antialiased">
        <main className="site-wrap py-16">
          <div className="card mx-auto max-w-[640px] px-6 py-8">
            <p className="text-sm text-muted">{M.site.errorTitle}</p>
            <h1 className="mt-1 text-h1-m font-semibold text-ink md:text-h1">
              {M.home.retryTitle}
            </h1>
            <p className="mt-2 text-body text-ink-2">{M.home.retryBody}</p>
            <a
              href=""
              className="mt-5 inline-flex h-11 items-center rounded-full bg-cta px-6 font-semibold text-white no-underline hover:bg-cta-hover"
            >
              {M.home.retry}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
