// Server API giả, chạy RIÊNG một tiến trình, đóng vai API Go (spec mục 6).
// Dùng để kiểm tiêu chí nghiệm thu 9.2: đổi NEXT_PUBLIC_API_BASE sang một API ở ngoài
// mà không phải sửa code trang. Cũng là mẫu hợp đồng API để BE đối chiếu.
//
//   npm run mock:api                       # http://localhost:4000
//   NEXT_PUBLIC_API_BASE=http://localhost:4000 npm run build && npm start
//
// Dùng chung mocks/handlers.js với chế độ mock trong app nên dữ liệu và kịch bản lỗi giống hệt.
// Ép nhánh lỗi bằng header "X-Mock-Scenario" (app gửi khi NEXT_PUBLIC_MOCK_SCENARIOS=1).
import { createServer } from 'node:http';
import { getResponse } from 'msw';
import { handlers } from '../mocks/handlers.js';

const PORT = Number(process.env.MOCK_API_PORT || 4000);

// API Go thật cũng cần CORS tương tự: trình duyệt gọi thẳng các endpoint mở SĐT, gợi ý, form.
const CORS = {
  'Access-Control-Allow-Origin': process.env.MOCK_API_CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Mock-Scenario',
  'Access-Control-Expose-Headers': 'Retry-After',
  'Access-Control-Max-Age': '600',
};

async function handle(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value != null) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const request = new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  });

  const response =
    (await getResponse(handlers, request)) ??
    Response.json(
      { error: { code: 'not_found', message: `Không có endpoint ${req.method} ${req.url}` } },
      { status: 404 },
    );

  const out = { ...CORS };
  response.headers.forEach((value, key) => {
    out[key] = value;
  });
  res.writeHead(response.status, out);
  res.end(Buffer.from(await response.arrayBuffer()));
}

createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    res.writeHead(500, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'internal', message: 'Lỗi mock server' } }));
  });
}).listen(PORT, () => {
  console.log(`Mock API (giả lập API Go) chạy tại http://localhost:${PORT}`);
});
