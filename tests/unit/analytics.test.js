import { describe, expect, it } from 'vitest';
import { sanitizeParams } from '@/lib/analytics';

describe('sanitizeParams', () => {
  it('bỏ giá trị giống SĐT hoặc email', () => {
    expect(sanitizeParams({ q: '0916 123 456', e: 'a@b.vn', ok: 'xay dung', count: 3 })).toEqual({
      ok: 'xay dung',
      count: 3,
    });
  });
  it('giữ MST ở khoá mst', () => {
    expect(sanitizeParams({ mst: '0319786701', ad_type: 'mock' })).toEqual({
      mst: '0319786701',
      ad_type: 'mock',
    });
  });
});
