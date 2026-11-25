// TẠM THỜI (25/11/2026): xem proxy Railway gửi IP người dùng ở header nào, để lớp chống crawl đếm đúng IP.
// Chỉ trả header của chính người gọi. Sẽ xoá ngay sau khi kiểm.
export const dynamic = 'force-dynamic';

export function GET(request) {
  if (request.nextUrl.searchParams.get('t') !== '20cd0568a3d64f4df5fcfb43')
    return new Response(null, { status: 404 });
  const out = {};
  for (const [k, v] of request.headers) {
    if (/ip|forward|client|envoy|real|via|railway|cf-/i.test(k)) out[k] = v;
  }
  return Response.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
