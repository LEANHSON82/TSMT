import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { mockFetch } = await import('@/mocks/server-fetch');

const get = async (path, headers) => {
  const res = await mockFetch(path, { headers });
  return { status: res.status, body: await res.json() };
};
const post = async (path, json, headers = {}) => {
  const res = await mockFetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(json),
  });
  return { status: res.status, body: await res.json() };
};

describe('mock API theo hợp đồng mục 6', () => {
  it('GET /v1/companies/{mst} không có trường phone', async () => {
    const { status, body } = await get('/v1/companies/0319786701');
    expect(status).toBe(200);
    expect(body.name).toBe('CÔNG TY TNHH GIẢI PHÁP KỸ THUẬT PC VIỆT NAM');
    expect(body).not.toHaveProperty('phone');
    expect(body.phone_masked).toBe('0916 *** ***');
    expect(JSON.stringify(body)).not.toContain('0916000000');
  });

  it('DN cùng ngành: chỉ cùng tỉnh, tối đa 10, không có SĐT', async () => {
    const { body: c } = await get('/v1/companies/0319786701');
    const { status, body } = await get('/v1/companies/0319786701/related?limit=10');
    expect(status).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(10);
    for (const r of body.items) {
      expect(r.mst).not.toBe(c.mst);
      expect(r.province.code).toBe(c.province.code);
      expect(r).not.toHaveProperty('phone');
    }
  });

  it('404 khi không có DN, lỗi đúng định dạng', async () => {
    const { status, body } = await get('/v1/companies/0000000000');
    expect(status).toBe(404);
    expect(body.error.code).toBe('not_found');
  });

  it('danh sách có dạng {items, page, page_size, total}', async () => {
    const { body } = await get('/v1/companies?province=79&page=1');
    expect(body.page).toBe(1);
    expect(body.page_size).toBe(20);
    expect(body.total).toBeGreaterThan(20);
    expect(body.items).toHaveLength(20);
    expect(body.items.every((c) => c.province.code === '79')).toBe(true);
    const dates = body.items.map((c) => c.founded_date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('tìm theo MST, tên, người đại diện', async () => {
    expect((await get('/v1/search?q=0319786701')).body.items[0].mst).toBe('0319786701');
    expect((await get('/v1/search?q=ky%20thuat%20pc')).body.items[0].mst).toBe('0319786701');
    expect(
      (await get('/v1/search?q=Nguy%E1%BB%85n%20Ng%E1%BB%8Dc%20Th%E1%BB%8Dc')).body.total,
    ).toBeGreaterThan(0);
  });

  it('suggest tối đa 8 dòng', async () => {
    const { body } = await get('/v1/suggest?q=cong%20ty');
    expect(body.items.length).toBeLessThanOrEqual(8);
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        mst: expect.any(String),
        name: expect.any(String),
        slug: expect.any(String),
        province: expect.any(String),
      }),
    );
  });

  it('luồng mở SĐT: tạo phiên → complete → trả phone', async () => {
    const u = await post('/v1/phone-unlocks', { mst: '0319786701' });
    expect(u.status).toBe(200);
    const c = await post(`/v1/phone-unlocks/${u.body.unlock_id}/complete`, {
      mst: '0319786701',
      ad_result: { type: 'mock' },
      turnstile_token: 't',
    });
    expect(c.body.phone).toBe('0916 000 000');
  });

  it('429 kèm retry_after', async () => {
    const u = await post('/v1/phone-unlocks', { mst: '0319786701' }, { 'x-mock-scenario': '429' });
    expect(u.status).toBe(429);
    expect(u.body.retry_after).toBe(300);
  });

  it('410 ở lần complete đầu, phiên mới thì thành công', async () => {
    const h = { 'x-mock-scenario': '410' };
    const body = { mst: '0319786701', ad_result: { type: 'mock' }, turnstile_token: 't' };
    const u1 = await post('/v1/phone-unlocks', { mst: '0319786701' }, h);
    expect((await post(`/v1/phone-unlocks/${u1.body.unlock_id}/complete`, body, h)).status).toBe(
      410,
    );
    const u2 = await post('/v1/phone-unlocks', { mst: '0319786701' }, h);
    expect((await post(`/v1/phone-unlocks/${u2.body.unlock_id}/complete`, body, h)).status).toBe(
      200,
    );
  });
});
