// Chuẩn hoá URL trước khi vào trang (spec mục 2, 9.2):
//   - Chi tiết DN /{mst} hoặc slug sai, trang ngành slug sai → redirect 301 về URL chuẩn
//     (permanentRedirect trong page/layout chỉ trả 308).
//   - MST / tỉnh / mã ngành sai hoặc không tồn tại, trang danh sách vượt số trang (?page=999)
//     → 404 kèm trang 404 render đầy đủ ở server (notFound() trong page của Next 15.5 trả HTML
//     khung trống, và trang có skeleton thì đã gửi 200 trước khi biết hết trang).
//   - Trang danh sách: ?tinh= không hợp lệ → 301 bỏ tham số đó (tránh cache rác). Việc chuyển
//     ?tinh=&page= vào route nội bộ ISR do rewrites() trong next.config.mjs làm, chạy sau middleware.
// Dữ liệu tra từ API (spec: ưu tiên slug của API), nhớ trong bộ nhớ để không gọi API mỗi lượt xem.
import { NextResponse } from 'next/server';
import { parseMstSlug } from './lib/mst.js';
import { toSlug } from './lib/slug.js';
import { NEW_WINDOW_DAYS, daysAgoVN } from './lib/filters.js';
import {
  MAX_LIST_PAGE,
  PASS_KINDS,
  THROTTLE_HARD,
  THROTTLE_SOFT,
  clientIp,
  countListView,
  isGatedPath,
  isListPath,
  spendPassPage,
  verifyPass,
} from './lib/list-gate.js';

export const config = {
  runtime: 'nodejs',
  matcher: [
    // Đường dẫn MỘT đoạn (chi tiết DN), trừ các trang/tệp có sẵn (ảnh do Next sinh: icon, opengraph-image…). Đoạn có
    // dấu chấm (/wp-login.php, /{mst}-{slug}.html) cũng vào đây để trả 404 / 301 thật — không rơi vào
    // trang [mstSlug] (có loading.js nên đã gửi 200 trước khi biết là 404).
    '/((?!_next|api|tinh|nganh|tim-kiem|doanh-nghiep-moi-thanh-lap|yeu-cau-cap-nhat|gioi-thieu|lien-he|dieu-khoan|chinh-sach-bao-mat|khong-tim-thay|mo-khoa|sitemap|sitemaps|robots|icon|favicon|opengraph-image|twitter-image|apple-icon|ads.txt)[^/]+)',
    // Đường dẫn có chữ hoa (link ngoài viết hoa) → 301 về chữ thường.
    '/((?!_next|api)(?:.*[A-Z].*))',
    // Truy cập thẳng trang 404 → trả đúng mã 404.
    '/khong-tim-thay',
    '/tinh/:slug',
    '/nganh/:codeSlug',
    '/doanh-nghiep-moi-thanh-lap',
    // Kết quả tìm: chỉ để đếm lượt xem theo IP / giới hạn độ sâu (lib/list-gate.js).
    '/tim-kiem',
    // Route nội bộ (q/…): truy cập thẳng thì 301 về URL công khai.
    '/tinh/:slug/q/:page',
    '/nganh/:codeSlug/q/:tinh/:page',
    '/doanh-nghiep-moi-thanh-lap/q/:tinh/:page',
  ],
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
const TTL_MS = 60 * 60 * 1000;
const TTL_NOT_FOUND_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 5000;
const cache = new Map(); // khoá → { value, at }

/**
 * Gốc URL để middleware gọi mock trong chính app. Có PORT (máy chủ chạy sau proxy, như Railway) → gọi thẳng
 * 127.0.0.1:PORT: gọi qua tên miền công khai (request.nextUrl.origin) từ trong container bị lỗi, middleware coi là
 * «API lỗi» và cho qua → MST không tồn tại trả 200 thay vì 404, /{mst} không 301 về URL có slug (2026-11-20).
 * Không có PORT (next dev / next start -p trên máy) → dùng origin của request như cũ.
 */
function mockOrigin(origin) {
  return process.env.PORT ? `http://127.0.0.1:${process.env.PORT}` : origin;
}

/**
 * GET {path} từ API (hoặc mock trong app), nhớ kết quả (404 nhớ ngắn hơn).
 * Trả { value, cached }: value là JSON nếu 200, null nếu 404, undefined nếu API lỗi (để trang tự xử lý).
 */
async function apiGet(path, origin, { fresh = false } = {}) {
  const hit = cache.get(path);
  if (!fresh && hit && Date.now() - hit.at < (hit.value === null ? TTL_NOT_FOUND_MS : TTL_MS)) {
    return { value: hit.value, cached: true };
  }
  const url = API_BASE ? `${API_BASE}${path}` : `${mockOrigin(origin)}/api/mock${path}`;
  let value;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 404) value = null;
    else if (res.ok) value = await res.json();
    else return { value: undefined };
  } catch {
    return { value: undefined };
  }
  cache.delete(path);
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(path, { value, at: Date.now() });
  return { value, cached: false };
}

/**
 * Như apiGet, nhưng nếu kết quả trong cache dẫn tới redirect/404 (isStale) thì hỏi lại API một lần:
 * tránh vòng redirect khi slug vừa đổi, hoặc 404 nhầm DN vừa có.
 */
async function lookup(path, origin, isStale) {
  const r = await apiGet(path, origin);
  if (r.cached && isStale(r.value)) return (await apiGet(path, origin, { fresh: true })).value;
  return r.value;
}

function redirect301(request, pathname) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url, 301);
}

function notFound(request) {
  const res = NextResponse.rewrite(new URL('/khong-tim-thay', request.url), { status: 404 });
  // Trang 404 dựng tĩnh mang cache 1 năm; một MST vừa đăng ký mà bị cache 404 lâu như vậy thì không ai thấy.
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate');
  return res;
}

async function company(request, segment) {
  const parsed = parseMstSlug(segment);
  if (!parsed) return notFound(request); // sai định dạng: 404, không gọi API
  const c = await lookup(
    `/v1/companies/${encodeURIComponent(parsed.mst)}`,
    request.nextUrl.origin,
    (v) => v === null || (v && (v.slug || '') !== parsed.slug),
  );
  if (c === undefined) return NextResponse.next();
  if (c === null) return notFound(request);
  const slug = c.slug || '';
  if (parsed.slug !== slug)
    return redirect301(request, slug ? `/${parsed.mst}-${slug}` : `/${parsed.mst}`);
  return NextResponse.next();
}

async function provinceList(origin, slug) {
  const data = await lookup('/v1/provinces', origin, (v) =>
    slug ? !(v?.items || []).some((p) => p.slug === slug) : false,
  );
  return data?.items;
}

function pageParam(request) {
  const n = Number.parseInt(request.nextUrl.searchParams.get('page'), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** ?tinh= có nhưng không hợp lệ → 301 về URL bỏ tham số đó. */
function dropProvinceParam(request) {
  const url = request.nextUrl.clone();
  url.searchParams.delete('tinh');
  return NextResponse.redirect(url, 301);
}

/** ?page=N (N > 1) mà API trả danh sách rỗng → vượt số trang. Cùng tham số trang danh sách gọi. */
async function pageOutOfRange(request, filters, path = '/v1/companies') {
  const page = pageParam(request);
  if (!(page > 1)) return false;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
  qs.set('sort', 'founded_desc');
  qs.set('page', String(page));
  const isEmpty = (v) => Boolean(v && Array.isArray(v.items) && v.items.length === 0);
  return isEmpty(await lookup(`${path}?${qs}`, request.nextUrl.origin, isEmpty));
}

/** Tỉnh của tham số ?tinh=: { code, slug }; undefined nếu không có tham số hoặc API lỗi; null nếu sai. */
async function provinceFilter(request) {
  const slug = request.nextUrl.searchParams.get('tinh');
  if (!slug) return undefined;
  const items = await provinceList(request.nextUrl.origin, slug);
  if (!items) return undefined;
  return items.find((p) => p.slug === slug) || null;
}

async function province(request, slug) {
  const items = await provinceList(request.nextUrl.origin, slug);
  if (!items) return NextResponse.next();
  const p = items.find((x) => x.slug === slug);
  if (!p) return notFound(request);
  if (await pageOutOfRange(request, { province: p.code })) return notFound(request);
  return NextResponse.next();
}

/** Màn hình /mo-khoa thay cho danh sách (URL giữ nguyên). loai: ad | human | sau | cham (xem app/mo-khoa). */
function gateScreen(request, loai, extra = {}, status) {
  const url = new URL('/mo-khoa', request.url);
  url.searchParams.set('p', request.nextUrl.pathname);
  url.searchParams.set('loai', loai);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, String(v));
  const res = NextResponse.rewrite(url, status ? { status } : undefined);
  // Cùng URL trả nội dung khác nhau theo cookie / IP → không cho proxy, CDN cache.
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
}

/** Vé loại kind trong cookie còn hạn và còn lượt → true (đã trừ một lượt). */
function spend(request, kind) {
  const pass = verifyPass(request.cookies.get(PASS_KINDS[kind].cookie)?.value, kind);
  if (!pass) return { ok: false, had: false };
  return { ok: spendPassPage(pass), had: true };
}

/**
 * Chống crawl trang danh sách (lib/list-gate.js). null = cho qua.
 *   trang > MAX_LIST_PAGE → màn hình «dùng bộ lọc» · IP quá THROTTLE_HARD lượt / 10 phút → 429 «thử lại sau»
 *   IP quá THROTTLE_SOFT lượt → cần vé «đã xác minh» (Turnstile). Trang DN mới dùng vé quảng cáo (adGate).
 */
function listGuard(request) {
  if (pageParam(request) > MAX_LIST_PAGE) return gateScreen(request, 'sau');
  const { count, retryAfter } = countListView(clientIp(request.headers));
  if (count > THROTTLE_HARD) {
    const res = gateScreen(request, 'cham', { phut: Math.ceil(retryAfter / 60) }, 429);
    res.headers.set('Retry-After', String(retryAfter));
    return res;
  }
  // Trang DN mới: cần vé quảng cáo — kiểm sau khi chuẩn hoá URL (301 / 404 trước), xem newCompanies().
  if (isGatedPath(request.nextUrl.pathname)) return null;
  if (count > THROTTLE_SOFT) {
    const r = spend(request, 'human');
    return r.ok ? null : gateScreen(request, 'human', r.had ? { het: 1 } : {});
  }
  return null;
}

/** Trang sau cổng quảng cáo: có vé quảng cáo còn lượt → cho qua (không cache ở proxy); không → màn hình cổng. */
function adGate(request) {
  const r = spend(request, 'ad');
  if (!r.ok) return gateScreen(request, 'ad', r.had ? { het: 1 } : {});
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}

async function newCompanies(request) {
  const prov = await provinceFilter(request);
  if (prov === null) return dropProvinceParam(request);
  // Trang DN mới chỉ gồm DN hoạt động trong 30 ngày gần nhất (app/doanh-nghiep-moi-thanh-lap/view.js) → đếm trang
  // bằng đúng truy vấn đó.
  if (
    await pageOutOfRange(
      request,
      { province: prov?.code, founded_from: daysAgoVN(NEW_WINDOW_DAYS) },
      '/v1/search',
    )
  )
    return notFound(request);
  return adGate(request);
}

async function industry(request, codeSlug) {
  const m = /^(\d{4})(?:-([a-z0-9-]+))?$/.exec(codeSlug);
  if (!m) return notFound(request);
  const given = m[2] || '';
  const ind = await lookup(
    `/v1/industries/${m[1]}`,
    request.nextUrl.origin,
    (v) => v === null || (v && (v.slug || toSlug(v.name)) !== given),
  );
  if (ind === undefined) return NextResponse.next();
  if (ind === null) return notFound(request);
  const slug = ind.slug || toSlug(ind.name);
  if (given !== slug) return redirect301(request, `/nganh/${m[1]}-${slug}`);
  const prov = await provinceFilter(request);
  if (prov === null) return dropProvinceParam(request);
  if (await pageOutOfRange(request, { industry: m[1], province: prov?.code })) {
    return notFound(request);
  }
  return NextResponse.next();
}

export async function middleware(request) {
  let path;
  try {
    path = decodeURIComponent(request.nextUrl.pathname);
  } catch {
    return notFound(request);
  }
  // URL có chữ hoa → 301 về chữ thường (slug, tỉnh, ngành đều là chữ thường).
  if (path !== path.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = path.toLowerCase();
    return NextResponse.redirect(url, 301);
  }
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 1 && parts[0] === 'khong-tim-thay') return notFound(request);

  // Một đoạn có dấu chấm: /{mst}-{slug}.html → 301 bỏ đuôi (rồi chuẩn hoá tiếp); còn lại → 404.
  if (parts.length === 1 && parts[0].includes('.')) {
    const stem = parts[0].replace(/\.(html?|php|aspx?)$/, '');
    if (stem !== parts[0] && parseMstSlug(stem)) return redirect301(request, `/${stem}`);
    return notFound(request);
  }

  // Truy cập thẳng route nội bộ → 301 về URL công khai (tránh trùng nội dung).
  const qi = parts.indexOf('q');
  if (qi > 0 && ['tinh', 'nganh', 'doanh-nghiep-moi-thanh-lap'].includes(parts[0])) {
    const base = `/${parts.slice(0, qi).join('/')}`;
    const rest = parts.slice(qi + 1);
    const tinh = rest.length === 2 && rest[0] !== '_' ? rest[0] : '';
    const page = rest[rest.length - 1];
    const url = request.nextUrl.clone();
    url.pathname = base;
    url.search = '';
    if (tinh) url.searchParams.set('tinh', tinh);
    if (Number(page) > 1) url.searchParams.set('page', page);
    return NextResponse.redirect(url, 301);
  }

  if (isListPath(path)) {
    const blocked = listGuard(request);
    if (blocked) return blocked;
  }
  if (parts.length === 1 && parts[0] === 'tim-kiem') return NextResponse.next();
  if (parts.length === 2 && parts[0] === 'tinh') return province(request, parts[1]);
  if (parts.length === 2 && parts[0] === 'nganh') return industry(request, parts[1]);
  if (parts.length === 1 && parts[0] === 'doanh-nghiep-moi-thanh-lap') return newCompanies(request);
  if (parts.length === 1) return company(request, parts[0]);
  return NextResponse.next();
}
