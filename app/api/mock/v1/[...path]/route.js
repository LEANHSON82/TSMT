// Mock server cho trình duyệt: /api/mock/v1/* → MSW handlers (mocks/handlers.js).
// Chỉ dùng khi NEXT_PUBLIC_API_BASE để trống. Khi có API Go thật, route này không được gọi.
import { mockFetch } from '@/mocks/server-fetch';

export const dynamic = 'force-dynamic';

async function forward(request, { params }) {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return Response.json(
      { error: { code: 'mock_disabled', message: 'Mock đã tắt' } },
      { status: 404 },
    );
  }
  const { path } = await params;
  const url = new URL(request.url);
  const init = { method: request.method, headers: request.headers };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = await request.arrayBuffer();
  const res = await mockFetch(`/v1/${path.join('/')}${url.search}`, init);
  return new Response(res.body, { status: res.status, headers: res.headers });
}

export const GET = forward;
export const POST = forward;
