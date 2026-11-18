// Mock API theo bản nháp hợp đồng (spec mục 6), viết bằng MSW handlers.
// Dùng ở 2 nơi (xem mocks/server-fetch.js):
//   - Server component gọi thẳng qua getResponse() (không cần mạng).
//   - Trình duyệt gọi /api/mock/v1/... (route handler chuyển tiếp vào đây).
// Ép nhánh lỗi khi test bằng header "x-mock-scenario": 429 | 410 | 500 | 403.
import { http, HttpResponse } from 'msw';
import companiesData from './data/companies.json' with { type: 'json' };
import phonesData from './data/phones.json' with { type: 'json' };
import provincesData from './data/provinces.json' with { type: 'json' };
import industriesData from './data/industries.json' with { type: 'json' };
import { buildIndex, countByField, FIELD_GROUPS, search } from './search.js';

const PAGE_SIZE = 20;
const UNLOCK_TTL_MS = 10 * 60 * 1000;

const byMst = new Map(companiesData.map((c) => [c.mst, c]));

// Trạng thái phiên mở SĐT, giữ trong bộ nhớ tiến trình.
const store = (globalThis.__mockUnlockStore ||= { unlocks: new Map(), seq: 0, requestSeq: 1200 });

// Bộ tìm mẫu (mocks/search.js): xếp hạng, matched, không tìm theo SĐT đã ẩn.
const searchIndex = buildIndex(companiesData, phonesData);

// Người đại diện: gộp theo tên (chữ hoa, gọn khoảng trắng). Không có mã định danh cá nhân công khai nên «cùng tên»
// không chắc là cùng một người — giao diện phải ghi rõ điều này.
const repKey = (name) =>
  String(name || '')
    .normalize('NFC')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
const repCount = new Map();
for (const c of companiesData)
  repCount.set(repKey(c.representative), (repCount.get(repKey(c.representative)) || 0) + 1);

/** Gộp các kết quả khớp người đại diện theo tên → [{ name, count, companies }], nhiều DN xếp trước. */
function groupPeople(results) {
  const groups = new Map();
  for (const r of results) {
    if (r.matched !== 'representative') continue;
    const k = repKey(r.c.representative);
    if (!groups.has(k)) groups.set(k, { name: r.c.representative, companies: [] });
    groups.get(k).companies.push(r.c);
  }
  return [...groups.values()];
}

function error(status, code, message, extra = {}) {
  return HttpResponse.json({ error: { code, message }, ...extra }, { status });
}

function paginate(items, pageParam) {
  const page = Math.max(1, Number.parseInt(pageParam, 10) || 1);
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    page,
    page_size: PAGE_SIZE,
    total: items.length,
  };
}

/** Bản ghi gửi ra ngoài: KHÔNG BAO GIỜ có trường phone. */
function publicCompany(c) {
  return c; // dữ liệu mock đã tách SĐT sang phones.json
}

function summary(c) {
  return {
    mst: c.mst,
    slug: c.slug,
    name: c.name,
    address: c.address,
    province: c.province,
    representative: c.representative,
    founded_date: c.founded_date,
    status: c.status,
  };
}

// province, industry: một mã hoặc nhiều mã cách nhau dấu phẩy (đề xuất mở rộng, README).
// founded_from=YYYY-MM-DD: chỉ DN thành lập từ ngày đó.
const csv = (v) => (v ? v.split(',').filter(Boolean) : []);

function hasFilters(url) {
  return ['province', 'status', 'industry', 'founded_from'].some((k) => url.searchParams.get(k));
}

function applyFilters(items, url) {
  const provinces = csv(url.searchParams.get('province'));
  const status = url.searchParams.get('status');
  const industries = csv(url.searchParams.get('industry'));
  const from = url.searchParams.get('founded_from');
  return items.filter(
    (c) =>
      (!provinces.length || provinces.includes(c.province.code)) &&
      (!status || c.status.code === status) &&
      (!industries.length || c.industries.some((i) => industries.includes(i.code))) &&
      (!from || (c.founded_date || '') >= from),
  );
}

const scenario = (request) => request.headers.get('x-mock-scenario') || '';

export const handlers = [
  http.get('*/v1/provinces', () => HttpResponse.json({ items: provincesData })),

  http.get('*/v1/industries', () =>
    HttpResponse.json({
      items: [...industriesData].sort((a, b) => a.code.localeCompare(b.code)),
    }),
  ),

  http.get('*/v1/industries/:code', ({ params }) => {
    const ind = industriesData.find((i) => i.code === params.code);
    return ind ? HttpResponse.json(ind) : error(404, 'not_found', 'Không có ngành này');
  }),

  // Đề xuất mở rộng hợp đồng (README): mỗi gợi ý kèm representative + matched để giao diện ghi rõ khớp ở đâu.
  http.get('*/v1/suggest', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') || '';
    if (q.trim().length < 2) return HttpResponse.json({ items: [] });
    const found = search(searchIndex, q, { mode: 'suggest' });
    const items = found.slice(0, 8).map(({ c, matched }) => ({
      mst: c.mst,
      name: c.name,
      slug: c.slug,
      province: c.province.name,
      representative: c.representative,
      matched,
    }));
    // Đề xuất mở rộng (README): người đại diện khớp từ khoá, gộp theo tên; company_count = tổng số DN có người
    // đại diện trùng tên này; company = DN tiêu biểu (dùng khi chỉ có 1 DN).
    const people = groupPeople(found)
      .slice(0, 6)
      .map((g) => ({
        name: g.name,
        company_count: repCount.get(repKey(g.name)) || g.companies.length,
        company: { mst: g.companies[0].mst, name: g.companies[0].name, slug: g.companies[0].slug },
      }));
    return HttpResponse.json({ items, people });
  }),

  // Đề xuất mở rộng: field=name|representative|number, sort=relevance|founded_desc|founded_asc,
  // industry=; trả thêm matched từng DN và counts (số kết quả theo từng nhóm «Tìm theo»).
  http.get('*/v1/search', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim();
    // Không từ khoá nhưng có bộ lọc: lọc toàn bộ DN (mới thành lập trước); không có gì → rỗng.
    const found = q
      ? search(searchIndex, q).filter((r) => applyFilters([r.c], url).length)
      : hasFilters(url)
        ? applyFilters(companiesData, url).map((c) => ({ c, matched: null }))
        : [];
    const counts = q ? countByField(found) : undefined;
    // Người đại diện khớp từ khoá trong kết quả (sau bộ lọc), gộp theo tên: [{ name, count }].
    const people = q
      ? groupPeople(found)
          .map((g) => ({ name: g.name, count: g.companies.length }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'))
          .slice(0, 12)
      : undefined;
    const field = url.searchParams.get('field');
    let list = FIELD_GROUPS[field]
      ? found.filter((r) => FIELD_GROUPS[field].includes(r.matched))
      : found;
    const sort = url.searchParams.get('sort');
    if (sort === 'founded_desc' || sort === 'founded_asc') {
      const dir = sort === 'founded_desc' ? -1 : 1;
      list = [...list].sort((a, b) => (a.c.founded_date < b.c.founded_date ? -dir : dir));
    }
    const page = paginate(list, url.searchParams.get('page'));
    return HttpResponse.json({
      ...page,
      counts,
      people,
      items: page.items.map((r) => ({ ...summary(r.c), matched: r.matched })),
    });
  }),

  http.get('*/v1/companies', ({ request }) => {
    const url = new URL(request.url);
    const items = applyFilters(companiesData, url); // dữ liệu đã sắp founded_desc
    const page = paginate(items, url.searchParams.get('page'));
    return HttpResponse.json({ ...page, items: page.items.map(summary) });
  }),

  http.get('*/v1/companies/:mst/related', ({ params, request }) => {
    const c = byMst.get(params.mst);
    if (!c) return error(404, 'not_found', 'Không tìm thấy doanh nghiệp');
    const limit = Math.min(20, Number(new URL(request.url).searchParams.get('limit')) || 10);
    const main = (c.industries.find((i) => i.is_main) || c.industries[0])?.code;
    // Đúng tiêu đề khối «DN cùng ngành tại [tỉnh]»: chỉ lấy DN cùng ngành chính VÀ cùng tỉnh.
    // Không đủ thì trả ít hơn `limit`, không lấy DN tỉnh khác bù vào.
    const items = companiesData
      .filter(
        (x) =>
          x.mst !== c.mst &&
          x.province.code === c.province.code &&
          x.industries.some((i) => i.code === main),
      )
      .slice(0, limit)
      .map(summary);
    return HttpResponse.json({ items });
  }),

  http.get('*/v1/companies/:mst', ({ params }) => {
    const c = byMst.get(params.mst);
    // representative_company_count (đề xuất mở rộng): số DN có người đại diện trùng tên, kể cả DN này.
    return c
      ? HttpResponse.json({
          ...publicCompany(c),
          representative_company_count: repCount.get(repKey(c.representative)) || 1,
        })
      : error(404, 'not_found', 'Không tìm thấy doanh nghiệp');
  }),

  http.post('*/v1/phone-unlocks', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    const c = byMst.get(body?.mst);
    if (!c) return error(404, 'not_found', 'Không tìm thấy doanh nghiệp');
    if (!c.has_phone || c.phone_hidden)
      return error(409, 'no_phone', 'Doanh nghiệp không có hoặc đã ẩn SĐT');
    if (scenario(request) === '429') {
      return error(429, 'rate_limited', 'Vượt giới hạn', { retry_after: 300 });
    }
    const id = `ul_${Date.now().toString(36)}_${++store.seq}`;
    const expiresAt = new Date(Date.now() + UNLOCK_TTL_MS);
    store.unlocks.set(id, { mst: c.mst, expiresAt: expiresAt.getTime(), attempts: 0 });
    return HttpResponse.json({ unlock_id: id, expires_at: expiresAt.toISOString() });
  }),

  http.post('*/v1/phone-unlocks/:id/complete', async ({ params, request }) => {
    const body = await request.json().catch(() => ({}));
    const sc = scenario(request);
    const unlock = store.unlocks.get(params.id);
    if (!unlock || unlock.expiresAt < Date.now())
      return error(410, 'expired', 'Phiên mở số đã hết hạn');
    if (unlock.mst !== body?.mst) return error(400, 'bad_request', 'MST không khớp');
    if (!body?.ad_result?.type) return error(400, 'bad_request', 'Thiếu ad_result');
    if (!body?.turnstile_token)
      return error(403, 'turnstile_invalid', 'Token xác minh không hợp lệ');
    unlock.attempts += 1;
    // 410: lần complete đầu tiên của phiên → hết hạn; FE phải tự tạo phiên mới, không bắt xem lại.
    if (sc === '410' && !store.expiredOnce?.has(unlock.mst)) {
      (store.expiredOnce ||= new Set()).add(unlock.mst);
      store.unlocks.delete(params.id);
      return error(410, 'expired', 'Phiên mở số đã hết hạn');
    }
    // 500: 3 lần đầu lỗi (1 lần gọi + 2 lần FE tự thử lại), lần bấm «Thử lại» thì thành công.
    if (sc === '500' && unlock.attempts <= 3) return error(500, 'server_error', 'Lỗi máy chủ');
    if (sc === '403' && unlock.attempts <= 1)
      return error(403, 'turnstile_invalid', 'Token xác minh không hợp lệ');
    store.unlocks.delete(params.id);
    store.expiredOnce?.delete(unlock.mst);
    const raw = phonesData[unlock.mst];
    const phone = raw ? `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7)}` : null;
    return HttpResponse.json({ phone });
  }),

  http.post('*/v1/update-requests', async ({ request }) => {
    const form = await request.formData().catch(() => null);
    if (!form) return error(400, 'bad_request', 'Dữ liệu không hợp lệ');
    const mst = String(form.get('mst') || '');
    if (!/^\d{10}(-\d{3})?$/.test(mst)) return error(422, 'invalid_mst', 'Mã số thuế không hợp lệ');
    if (!form.get('email') || !form.get('request_type'))
      return error(422, 'invalid', 'Thiếu thông tin bắt buộc');
    const code = `YC-2026-${String(++store.requestSeq).padStart(6, '0')}`;
    return HttpResponse.json({ request_code: code }, { status: 201 });
  }),

  http.get('*/v1/sitemap/companies', ({ request }) => {
    const page = Math.max(1, Number(new URL(request.url).searchParams.get('page')) || 1);
    const size = 50000;
    const items = companiesData
      .slice((page - 1) * size, page * size)
      .map((c) => ({ mst: c.mst, slug: c.slug, updated_at: c.updated_at }));
    return HttpResponse.json({ items, page, page_size: size, total: companiesData.length });
  }),
];
