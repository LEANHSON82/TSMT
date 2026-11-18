// /ads.txt — khai báo đơn vị được phép bán quảng cáo trên site (Google bắt buộc để nhận tiền đầy đủ).
// Đặt GOOGLE_AD_PUBLISHER_ID=pub-xxxxxxxxxxxxxxxx (mã publisher AdSense / Ad Manager của owner) trên máy chủ.
// Chưa đặt → 404 (không khai báo sai). Đọc lúc chạy nên đổi biến môi trường không cần build lại.
export const dynamic = 'force-dynamic';

export function GET() {
  const pub = (process.env.GOOGLE_AD_PUBLISHER_ID || '').trim();
  if (!/^pub-\d{10,20}$/.test(pub)) return new Response('Not found', { status: 404 });
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
