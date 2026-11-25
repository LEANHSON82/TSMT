import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AD_PASS_PAGES,
  HUMAN_PASS_PAGES,
  PASS_PER_IP_PER_HOUR,
  PASS_TTL_S,
  THROTTLE_WINDOW_MS,
  _resetListGate,
  clientIp,
  countListView,
  createPass,
  isGatedPath,
  isListPath,
  spendPassPage,
  takeIpQuota,
  verifyPass,
} from '../../lib/list-gate.js';

beforeEach(() => _resetListGate());
afterEach(() => {
  delete process.env.TRUST_CF_IP;
  delete process.env.E2E_TRUST_TEST_IP;
});

describe('vé mở danh sách', () => {
  it('vé vừa tạo hợp lệ, có hạn PASS_TTL_S, đúng loại', () => {
    const now = Date.now();
    const pass = createPass('ad', now);
    const v = verifyPass(pass.value, 'ad', now);
    expect(v.id).toBe(pass.id);
    expect(v.exp).toBe(Math.floor(now / 1000) + PASS_TTL_S);
    // Vé «đã xác minh» không mở được cổng quảng cáo và ngược lại.
    expect(verifyPass(pass.value, 'human', now)).toBeNull();
    expect(verifyPass(createPass('human', now).value, 'ad', now)).toBeNull();
    expect(verifyPass(createPass('human', now).value, 'human', now)).not.toBeNull();
  });

  it('hết hạn, sửa nội dung hoặc chữ ký, giá trị rác → không hợp lệ', () => {
    const now = Date.now();
    const pass = createPass('ad', now);
    expect(verifyPass(pass.value, 'ad', now + (PASS_TTL_S + 1) * 1000)).toBeNull();
    const [data, sig] = pass.value.split('.');
    const forged = Buffer.from(JSON.stringify({ id: 'x', exp: 9999999999, k: 'ad' })).toString(
      'base64url',
    );
    expect(verifyPass(`${forged}.${sig}`, 'ad', now)).toBeNull();
    expect(verifyPass(`${data}.${sig.slice(0, -2)}aa`, 'ad', now)).toBeNull();
    for (const junk of [undefined, '', 'abc', '.', 'a.b', 'x'.repeat(400)])
      expect(verifyPass(junk, 'ad', now)).toBeNull();
  });

  it('mỗi loại vé có số trang riêng', () => {
    const ad = verifyPass(createPass('ad').value, 'ad');
    for (let i = 0; i < AD_PASS_PAGES; i++) expect(spendPassPage(ad)).toBe(true);
    expect(spendPassPage(ad)).toBe(false);
    const human = verifyPass(createPass('human').value, 'human');
    for (let i = 0; i < HUMAN_PASS_PAGES; i++) expect(spendPassPage(human)).toBe(true);
    expect(spendPassPage(human)).toBe(false);
  });

  it('mỗi IP xin tối đa PASS_PER_IP_PER_HOUR vé mỗi giờ', () => {
    const now = Date.now();
    for (let i = 0; i < PASS_PER_IP_PER_HOUR; i++) expect(takeIpQuota('1.2.3.4', now)).toBe(0);
    expect(takeIpQuota('1.2.3.4', now)).toBeGreaterThan(0);
    expect(takeIpQuota('5.6.7.8', now)).toBe(0);
    expect(takeIpQuota('1.2.3.4', now + 3601 * 1000)).toBe(0);
  });
});

describe('đếm lượt xem danh sách theo IP', () => {
  it('đếm trong cửa sổ, sang cửa sổ mới thì đếm lại; không biết IP thì không đếm', () => {
    const now = Date.now();
    expect(countListView('1.1.1.1', now).count).toBe(1);
    expect(countListView('1.1.1.1', now).count).toBe(2);
    expect(countListView('2.2.2.2', now).count).toBe(1);
    expect(countListView('1.1.1.1', now + THROTTLE_WINDOW_MS + 1).count).toBe(1);
    expect(countListView('', now).count).toBe(0);
  });

  it('trang danh sách và trang có cổng quảng cáo', () => {
    expect(isGatedPath('/doanh-nghiep-moi-thanh-lap')).toBe(true);
    expect(isGatedPath('/tinh/ha-noi')).toBe(false);
    for (const p of ['/tinh/ha-noi', '/nganh/4330-abc', '/tim-kiem', '/doanh-nghiep-moi-thanh-lap'])
      expect(isListPath(p), p).toBe(true);
    for (const p of ['/', '/0319786701-abc', '/tinh/ha-noi/q/2', '/gioi-thieu'])
      expect(isListPath(p), p).toBe(false);
  });
});

describe('IP người dùng', () => {
  it('Railway: X-Real-IP, không có thì phần tử CUỐI của X-Forwarded-For (phần đầu khách tự ghi được)', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '7.7.7.7', 'x-forwarded-for': '1.1.1.1' }))).toBe(
      '7.7.7.7',
    );
    expect(clientIp(new Headers({ 'x-forwarded-for': 'gia-mao, 9.9.9.9' }))).toBe('9.9.9.9');
    expect(clientIp(new Headers())).toBe('');
  });

  it('CF-Connecting-IP chỉ tin khi TRUST_CF_IP=1; X-E2E-IP chỉ tin khi E2E_TRUST_TEST_IP=1', () => {
    const h = new Headers({
      'cf-connecting-ip': '8.8.8.8',
      'x-e2e-ip': 't1',
      'x-real-ip': '7.7.7.7',
    });
    expect(clientIp(h)).toBe('7.7.7.7');
    process.env.TRUST_CF_IP = '1';
    expect(clientIp(h)).toBe('8.8.8.8');
    process.env.E2E_TRUST_TEST_IP = '1';
    expect(clientIp(h)).toBe('t1');
  });
});
