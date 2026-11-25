import { beforeEach, describe, expect, it } from 'vitest';
import {
  PASS_PAGE_BUDGET,
  PASS_PER_IP_PER_HOUR,
  PASS_TTL_S,
  _resetListGate,
  clientIp,
  createPass,
  isGatedPath,
  takeIpQuota,
  spendPassPage,
  verifyPass,
} from '../../lib/list-gate.js';

beforeEach(() => _resetListGate());

describe('vé mở danh sách', () => {
  it('vé vừa tạo hợp lệ, có hạn PASS_TTL_S', () => {
    const now = Date.now();
    const pass = createPass(now);
    const v = verifyPass(pass.value, now);
    expect(v.id).toBe(pass.id);
    expect(v.exp).toBe(Math.floor(now / 1000) + PASS_TTL_S);
  });

  it('hết hạn, sửa nội dung hoặc chữ ký, giá trị rác → không hợp lệ', () => {
    const now = Date.now();
    const pass = createPass(now);
    expect(verifyPass(pass.value, now + (PASS_TTL_S + 1) * 1000)).toBeNull();
    const [data, sig] = pass.value.split('.');
    const forged = Buffer.from(JSON.stringify({ id: 'x', exp: 9999999999 })).toString('base64url');
    expect(verifyPass(`${forged}.${sig}`, now)).toBeNull();
    expect(verifyPass(`${data}.${sig.slice(0, -2)}aa`, now)).toBeNull();
    for (const junk of [undefined, '', 'abc', '.', 'a.b', 'x'.repeat(400)])
      expect(verifyPass(junk, now)).toBeNull();
  });

  it('mỗi vé xem tối đa PASS_PAGE_BUDGET trang', () => {
    const pass = verifyPass(createPass().value);
    for (let i = 0; i < PASS_PAGE_BUDGET; i++) expect(spendPassPage(pass)).toBe(true);
    expect(spendPassPage(pass)).toBe(false);
    expect(spendPassPage(verifyPass(createPass().value))).toBe(true);
  });

  it('mỗi IP xin tối đa PASS_PER_IP_PER_HOUR vé mỗi giờ', () => {
    const now = Date.now();
    for (let i = 0; i < PASS_PER_IP_PER_HOUR; i++) expect(takeIpQuota('1.2.3.4', now)).toBe(0);
    expect(takeIpQuota('1.2.3.4', now)).toBeGreaterThan(0);
    expect(takeIpQuota('5.6.7.8', now)).toBe(0);
    expect(takeIpQuota('1.2.3.4', now + 3601 * 1000)).toBe(0);
  });

  it('đường dẫn bị chặn và IP sau proxy', () => {
    expect(isGatedPath('/doanh-nghiep-moi-thanh-lap')).toBe(true);
    expect(isGatedPath('/tinh/ha-noi')).toBe(false);
    expect(clientIp(new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('9.9.9.9');
    expect(
      clientIp(new Headers({ 'cf-connecting-ip': '8.8.8.8', 'x-forwarded-for': '1.1.1.1' })),
    ).toBe('8.8.8.8');
  });
});
