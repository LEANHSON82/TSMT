// Cấp «vé» xem danh sách (lib/list-gate.js).
//   POST { ad_result: { type }, turnstile_token }            → vé 'ad' (cổng quảng cáo trang DN mới), cookie list_pass
//   POST { mode: 'human', turnstile_token }                  → vé 'human' (xem quá nhiều trang), cookie list_human
// 204 + cookie (HttpOnly, hạn 30 phút) · 400 thiếu kết quả quảng cáo · 403 Turnstile sai · 429 IP xin quá nhiều vé.
// Kết quả quảng cáo không xác minh được ở đây (giống luồng SĐT, spec 4.3: xác minh quảng cáo thật là việc của BE);
// thứ chặn bot là Turnstile + giới hạn vé theo IP + giới hạn số trang mỗi vé.
import { NextResponse } from 'next/server';
import { PASS_KINDS, PASS_TTL_S, clientIp, createPass, takeIpQuota } from '@/lib/list-gate';

export const dynamic = 'force-dynamic';

const AD_TYPES = new Set(['rewarded', 'fallback', 'mock']);
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const error = (status, code, headers) =>
  NextResponse.json({ error: { code } }, { status, headers });

/** Kiểm token Turnstile với Cloudflare. Không có TURNSTILE_SECRET_KEY (dev, mock) → chỉ cần token khác rỗng. */
async function turnstileOk(token, ip) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const key = process.env.TURNSTILE_SECRET_KEY;
  if (!key) return true;
  try {
    const body = new URLSearchParams({ secret: key, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch(SITEVERIFY, { method: 'POST', body, cache: 'no-store' });
    const data = await res.json();
    return data?.success === true;
  } catch {
    return false;
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const kind = body?.mode === 'human' ? 'human' : 'ad';
  if (!body || (kind === 'ad' && !AD_TYPES.has(body.ad_result?.type))) {
    return error(400, 'bad_request');
  }
  const ip = clientIp(request.headers);
  if (!(await turnstileOk(body.turnstile_token, ip))) return error(403, 'turnstile_invalid');
  const wait = takeIpQuota(ip);
  if (wait) return error(429, 'rate_limited', { 'Retry-After': String(wait) });

  const pass = createPass(kind);
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(PASS_KINDS[kind].cookie, pass.value, {
    httpOnly: true,
    sameSite: 'lax',
    // Sau proxy (Railway) request tới app là http; giao thức thật nằm ở X-Forwarded-Proto.
    secure:
      request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: PASS_TTL_S,
  });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
