'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useEffect } from 'react';
import { ErrorState } from '@/components/States';
import { M } from '@/lib/messages';

// Lỗi khi tải dữ liệu: câu thông báo + nút Thử lại (spec mục 3).
export default function Error({ error, reset }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-12 md:px-6">
      <h1 className="sr-only">{M.site.errorTitle}</h1>
      <ErrorState
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
