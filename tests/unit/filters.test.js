// Lọc nâng cao: đọc tham số URL, tính ngày «thành lập trong», API giả lọc nhiều tỉnh / ngành / ngày.
import { describe, expect, it, vi } from 'vitest';
import { foundedFrom, listParam, todayVN } from '@/lib/filters';

vi.mock('server-only', () => ({}));
const { mockFetch } = await import('@/mocks/server-fetch');
const get = async (path) => (await mockFetch(path)).json();

describe('listParam', () => {
  it('nhận dạng phẩy, dạng lặp lại; bỏ rỗng, bỏ trùng', () => {
    expect(listParam(undefined)).toEqual([]);
    expect(listParam('ha-noi,ho-chi-minh')).toEqual(['ha-noi', 'ho-chi-minh']);
    expect(listParam(['ha-noi', 'da-nang,ha-noi', ''])).toEqual(['ha-noi', 'da-nang']);
    expect(listParam(' , ,')).toEqual([]);
  });
});

describe('foundedFrom', () => {
  const now = new Date('2026-11-18T03:00:00Z');
  it('tính lùi theo ngày / tháng / năm, giờ Việt Nam', () => {
    expect(foundedFrom('7-ngay', now)).toBe('2026-11-11');
    expect(foundedFrom('30-ngay', now)).toBe('2026-10-19');
    expect(foundedFrom('3-thang', now)).toBe('2026-08-18');
    expect(foundedFrom('1-nam', now)).toBe('2025-11-18');
    expect(foundedFrom('3-nam', now)).toBe('2023-11-18');
    expect(foundedFrom('khac', now)).toBe('');
  });
  it('cuối tháng không nhảy sang tháng sau; 23h UTC đã là ngày mới ở Việt Nam', () => {
    expect(foundedFrom('3-thang', new Date('2026-05-31T03:00:00Z'))).toBe('2026-02-28');
    expect(todayVN(new Date('2026-11-17T18:00:00Z'))).toBe('2026-11-18');
  });
});

describe('API giả /v1/search lọc nâng cao', () => {
  it('nhiều tỉnh, không từ khoá: chỉ DN ở các tỉnh đó, mới thành lập trước', async () => {
    const body = await get('/v1/search?province=01,79&sort=founded_desc');
    expect(body.total).toBeGreaterThan(0);
    for (const c of body.items) expect(['01', '79']).toContain(c.province.code);
    const dates = body.items.map((c) => c.founded_date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('nhiều ngành + thành lập từ ngày', async () => {
    const all = await get('/v1/search?industry=6201,4330');
    const recent = await get('/v1/search?industry=6201,4330&founded_from=2026-10-19');
    expect(all.total).toBeGreaterThan(recent.total);
    for (const c of recent.items) expect(c.founded_date >= '2026-10-19').toBe(true);
  });

  it('không từ khoá, không bộ lọc → toàn bộ DN, mới thành lập trước', async () => {
    const body = await get('/v1/search?sort=founded_desc');
    expect(body.total).toBe(248);
    expect(body.items).toHaveLength(20);
    const dates = body.items.map((c) => c.founded_date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('danh mục ngành GET /v1/industries', async () => {
    const body = await get('/v1/industries');
    expect(body.items.length).toBeGreaterThan(10);
    expect(body.items[0]).toHaveProperty('code');
  });
});
