// Gọi mock handlers trực tiếp (không qua mạng) bằng getResponse của MSW.
// Chỉ chạy phía server: dữ liệu SĐT giả không bao giờ lọt vào bundle trình duyệt.
import 'server-only';
import { getResponse } from 'msw';
import { handlers } from './handlers.js';

export const MOCK_ORIGIN = 'http://mock.local';

export async function mockFetch(path, init = {}) {
  const request = new Request(`${MOCK_ORIGIN}${path}`, init);
  const response = await getResponse(handlers, request);
  return (
    response ??
    Response.json(
      { error: { code: 'not_found', message: `Không có mock cho ${path}` } },
      { status: 404 },
    )
  );
}
