import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatMoneyWords,
  formatNumber,
  areaAddress,
  shortAddress,
  truncate,
} from '@/lib/format';

describe('format', () => {
  it('formatMoney dùng dấu chấm ngăn cách và hậu tố đ', () => {
    expect(formatMoney(1000000000)).toBe('1.000.000.000 đ');
    expect(formatMoney(10000000000)).toBe('10.000.000.000 đ');
    expect(formatMoney(null)).toBe('');
  });
  it('formatMoneyWords', () => {
    expect(formatMoneyWords(10000000000)).toBe('10 tỷ đồng');
    expect(formatMoneyWords(1500000000)).toBe('1,5 tỷ đồng');
    expect(formatMoneyWords(500000000)).toBe('500 triệu đồng');
  });
  it('formatNumber', () => {
    expect(formatNumber(612480)).toBe('612.480');
  });
  it('formatDate dd/mm/yyyy', () => {
    expect(formatDate('2026-11-12')).toBe('12/11/2026');
    expect(formatDate('')).toBe('');
  });
  it('formatDateTime theo giờ Việt Nam', () => {
    expect(formatDateTime('2026-11-14T08:37:09+07:00')).toBe('14/11/2026 08:37');
    expect(formatDateTime('2026-11-14T01:37:09Z')).toBe('14/11/2026 08:37');
  });
  it('areaAddress: phường/xã + tỉnh, bỏ số nhà', () => {
    const a = 'Số 299 Đường Quang Trung, Phường Hồng Hải, Thành phố Hà Nội, Việt Nam';
    expect(areaAddress(a, 'Hà Nội')).toBe('Phường Hồng Hải, Hà Nội');
    expect(areaAddress(a, 'Hà Nội', { withProvince: false })).toBe('Phường Hồng Hải');
    expect(
      areaAddress('Số 175 Phan Chu Trinh, Xã Tân Phú, Thành phố Hà Nội, Việt Nam', 'Hà Nội'),
    ).toBe('Xã Tân Phú, Hà Nội');
    // Địa chỉ theo đơn vị cũ (còn quận/huyện)
    expect(
      areaAddress('12 Lê Lợi, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh', 'TP Hồ Chí Minh'),
    ).toBe('Phường Bến Nghé, Quận 1, TP Hồ Chí Minh');
    // Không nhận ra phường/xã → giữ nguyên địa chỉ
    expect(areaAddress('75N/2A Đường số 2, TP HCM, Việt Nam')).toBe('75N/2A Đường số 2, TP HCM');
  });
  it('shortAddress bỏ ", Việt Nam"', () => {
    expect(shortAddress('75N/2A Đường số 2, TP HCM, Việt Nam')).toBe('75N/2A Đường số 2, TP HCM');
  });
  it('truncate', () => {
    expect(truncate('abcdef', 4)).toBe('abc…');
    expect(truncate('abc', 4)).toBe('abc');
  });
});
