'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useEffect } from 'react';
import ErrorState from '@/components/ErrorState';
import { M } from '@/lib/messages';

// Lỗi khi tải dữ liệu: câu thông báo + nút Thử lại (spec mục 3). Bố cục như trang 404: dòng «Đã có lỗi xảy ra»
// nằm đúng chỗ breadcrumb → H1 cùng vị trí với mọi trang.
export default function Error({ error, reset }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="site-wrap">
      <p className="pt-3 pb-3 text-sm text-muted md:pt-5 md:pb-4">{M.site.errorTitle}</p>
      <ErrorState
        as="h1"
        onRetry={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
      />
    </main>
  );
}
