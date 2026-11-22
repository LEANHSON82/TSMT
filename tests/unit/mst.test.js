import { describe, expect, it } from 'vitest';
import { isValidMst, normalizeMst, parseMstSlug, companyPath } from '@/lib/mst';

describe('isValidMst', () => {
  it('chấp nhận 10 số hoặc 10 số + -3 số', () => {
    expect(isValidMst('0319786701')).toBe(true);
    expect(isValidMst('0101234567-001')).toBe(true);
    expect(isValidMst(' 0319 786 701 ')).toBe(true);
    expect(isValidMst('0101234567001')).toBe(true);
  });
  it('từ chối sai định dạng', () => {
    expect(isValidMst('031978670')).toBe(false);
    expect(isValidMst('03197867012')).toBe(false);
    expect(isValidMst('0101234567-01')).toBe(false);
    expect(isValidMst('công ty abc')).toBe(false);
    expect(isValidMst('')).toBe(false);
  });
});

describe('normalizeMst', () => {
  it('chuẩn hoá về dạng có gạch nối cho chi nhánh', () => {
    expect(normalizeMst('0101234567001')).toBe('0101234567-001');
    expect(normalizeMst('0101.234.567')).toBe('0101234567');
  });
});

describe('parseMstSlug', () => {
  it('tách mst và slug', () => {
    expect(parseMstSlug('0319786701-cong-ty-tnhh-pc')).toEqual({
      mst: '0319786701',
      slug: 'cong-ty-tnhh-pc',
    });
    expect(parseMstSlug('0319786701')).toEqual({ mst: '0319786701', slug: '' });
  });
  it('nhận MST chi nhánh', () => {
    expect(parseMstSlug('0101234567-001-chi-nhanh-ha-noi')).toEqual({
      mst: '0101234567-001',
      slug: 'chi-nhanh-ha-noi',
    });
    expect(parseMstSlug('0101234567-001')).toEqual({ mst: '0101234567-001', slug: '' });
  });
  it('trả null khi sai định dạng', () => {
    expect(parseMstSlug('123-abc')).toBeNull();
    expect(parseMstSlug('0319786701-CONG-TY')).toBeNull();
    expect(parseMstSlug('0319786701--abc')).toBeNull();
    expect(parseMstSlug('tim-kiem')).toBeNull();
    expect(parseMstSlug(undefined)).toBeNull();
  });
});

describe('normalizeMst — kiểu dán thường gặp', () => {
  it('bỏ nhãn «MST» / «Mã số thuế», đổi mọi kiểu gạch', () => {
    expect(normalizeMst('MST 0319786701')).toBe('0319786701');
    expect(normalizeMst('mst: 0319786701')).toBe('0319786701');
    expect(normalizeMst('Mã số thuế 0101234567')).toBe('0101234567');
    expect(normalizeMst('0195805215–001')).toBe('0195805215-001');
    expect(normalizeMst('0195805215 - 001')).toBe('0195805215-001');
    expect(normalizeMst('4600561578_003')).toBe('4600561578-003');
    expect(isValidMst('MST: 4600561578–003')).toBe(true);
  });
  it('không cắt chữ «mst» khi phía sau không phải số', () => {
    expect(isValidMst('mst abc')).toBe(false);
  });
});

describe('companyPath', () => {
  it('ghép URL chuẩn', () => {
    expect(companyPath({ mst: '0319786701', slug: 'abc' })).toBe('/0319786701-abc');
  });
});
