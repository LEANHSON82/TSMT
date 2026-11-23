// Chỗ DUY NHẤT gọi API (spec mục 1, 6). Đổi NEXT_PUBLIC_API_BASE từ mock sang API Go
// mà không phải sửa code trang.
//   - NEXT_PUBLIC_API_BASE trống → mock: server gọi thẳng MSW handlers, trình duyệt gọi /api/mock/v1.
//   - NEXT_PUBLIC_API_BASE=https://api... → gọi API thật.

import { mockFetch } from '#mock-fetch';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
export const USING_MOCK = !API_BASE;
// Cho phép ?mock=429|410|500 trên URL: luôn bật khi chạy mock trong app; với API ngoài
// (scripts/mock-api-server.mjs hoặc API Go staging) thì bật bằng NEXT_PUBLIC_MOCK_SCENARIOS=1.
// Production KHÔNG đặt biến này.
const MOCK_SCENARIOS = USING_MOCK || process.env.NEXT_PUBLIC_MOCK_SCENARIOS === '1';

export class ApiError extends Error {
  constructor(status, code, message, body = {}) {
    super(message || code || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status; // 0 = lỗi mạng
    this.code = code;
    this.body = body;
    this.retryAfter = body.retry_after;
  }
}

/** Trên trình duyệt (khi MOCK_SCENARIOS bật): ?mock=429|410|500 trên URL trang được chuyển thành header để ép nhánh lỗi. */
function mockScenarioHeader() {
  if (!MOCK_SCENARIOS || typeof window === 'undefined') return {};
  try {
    const sc = new URLSearchParams(window.location.search).get('mock');
    return sc ? { 'x-mock-scenario': sc } : {};
  } catch {
    return {};
  }
}

// "#mock-fetch" (package.json → imports): server component dùng mocks/server-fetch.js (gọi thẳng MSW handlers),
// trình duyệt dùng mocks/client-fetch.js (gọi /api/mock/v1). Dữ liệu mock không lọt vào bundle trình duyệt.
async function rawFetch(path, init) {
  if (USING_MOCK) return mockFetch(path, init);
  return fetch(`${API_BASE}${path}`, init);
}

async function request(path, { method = 'GET', json, body, headers, revalidate, signal } = {}) {
  const init = {
    method,
    signal,
    headers: { Accept: 'application/json', ...mockScenarioHeader(), ...headers },
  };
  if (json !== undefined) {
    init.body = JSON.stringify(json);
    init.headers['Content-Type'] = 'application/json';
  } else if (body !== undefined) {
    init.body = body;
  }
  if (
    !USING_MOCK &&
    typeof window === 'undefined' &&
    method === 'GET' &&
    revalidate !== undefined
  ) {
    init.next = { revalidate };
  }

  let res;
  try {
    res = await rawFetch(path, init);
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, 'network_error', 'Lỗi mạng');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const retryHeader = Number(res.headers.get('Retry-After'));
    if (!data.retry_after && retryHeader) data.retry_after = retryHeader;
    throw new ApiError(res.status, data?.error?.code, data?.error?.message, data);
  }
  return data;
}

function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

const notFoundToNull = (err) => {
  if (err instanceof ApiError && err.status === 404) return null;
  throw err;
};

// ---- Đọc dữ liệu (server component) ----

export function getCompany(mst) {
  return request(`/v1/companies/${encodeURIComponent(mst)}`, { revalidate: 86400 }).catch(
    notFoundToNull,
  );
}

export function getRelatedCompanies(mst, limit = 10) {
  return request(`/v1/companies/${encodeURIComponent(mst)}/related${qs({ limit })}`, {
    revalidate: 86400,
  })
    .then((d) => d.items || [])
    .catch((err) => {
      // Không có dữ liệu liên quan (404) → danh sách rỗng; lỗi mạng / 5xx → ném lỗi để trang ISR giữ bản cũ.
      if (err instanceof ApiError && err.status === 404) return [];
      throw err;
    });
}

// field: name | representative | number; sort: founded_desc | founded_asc (bỏ trống = phù hợp nhất).
// Hai tham số này, industry, và trường counts / matched trong kết quả là đề xuất mở rộng hợp đồng API
// (README). API chưa hỗ trợ thì trang vẫn chạy: không có counts thì ẩn số đếm trên tab.
/**
 * Tìm / lọc DN. province, industry: một mã hoặc mảng mã (gửi dạng «01,79»). foundedFrom: YYYY-MM-DD.
 * q có thể rỗng: duyệt toàn bộ DN theo bộ lọc, không lọc gì = tất cả (đề xuất mở rộng API, README).
 */
export function searchCompanies({
  q,
  province,
  status,
  industry,
  foundedFrom,
  field,
  sort,
  page,
} = {}) {
  const list = (v) => (Array.isArray(v) ? v.join(',') : v);
  return request(
    `/v1/search${qs({
      q,
      province: list(province),
      status,
      industry: list(industry),
      founded_from: foundedFrom,
      field,
      sort,
      page,
    })}`,
  );
}

export function listCompanies({ province, industry, sort = 'founded_desc', page } = {}) {
  return request(`/v1/companies${qs({ province, industry, sort, page })}`, { revalidate: 3600 });
}

export async function getProvinces() {
  const d = await request('/v1/provinces', { revalidate: 3600 });
  return d.items || [];
}

/** Danh mục ngành (đề xuất API GET /v1/industries, README). [{ code, name, slug }] */
export async function getIndustries() {
  const d = await request('/v1/industries', { revalidate: 86400 });
  return d.items || [];
}

export function getIndustry(code) {
  return request(`/v1/industries/${encodeURIComponent(code)}`, { revalidate: 86400 }).catch(
    notFoundToNull,
  );
}

export function getSitemapCompanies(page = 1) {
  return request(`/v1/sitemap/companies${qs({ page })}`, { revalidate: 3600 });
}

// ---- Gọi từ trình duyệt ----

/** Gợi ý khi gõ: { items: DN, people: người đại diện gộp theo tên (đề xuất mở rộng, có thể không có) }. */
export async function suggestCompanies(q, { signal } = {}) {
  const d = await request(`/v1/suggest${qs({ q })}`, { signal });
  return { items: d.items || [], people: d.people || null };
}

export function createPhoneUnlock(mst) {
  return request('/v1/phone-unlocks', { method: 'POST', json: { mst } });
}

export function completePhoneUnlock(unlockId, { mst, ad_result, turnstile_token }) {
  return request(`/v1/phone-unlocks/${encodeURIComponent(unlockId)}/complete`, {
    method: 'POST',
    json: { mst, ad_result, turnstile_token },
  });
}

export function submitUpdateRequest(formData) {
  return request('/v1/update-requests', { method: 'POST', body: formData });
}
