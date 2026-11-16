import { describe, expect, it } from 'vitest';
import { highlightParts } from '@/lib/highlight';

const hits = (t, q) =>
  highlightParts(t, q)
    .filter((p) => p.hit)
    .map((p) => p.text);

describe('highlightParts', () => {
  it('không phân biệt hoa/thường và dấu', () => {
    expect(hits('CÔNG TY CỔ PHẦN XÂY DỰNG SÔNG HỒNG', 'xây dựng')).toEqual(['XÂY DỰNG']);
    expect(hits('CÔNG TY CỔ PHẦN XÂY DỰNG SÔNG HỒNG', 'xay dung')).toEqual(['XÂY DỰNG']);
    expect(hits('ĐẦU TƯ ĐỨC TÀI', 'duc')).toEqual(['ĐỨC']);
  });
  it('nhiều lần khớp, ghép lại đúng chuỗi gốc', () => {
    const parts = highlightParts('NAM PHƯƠNG NAM', 'nam');
    expect(parts.map((p) => p.text).join('')).toBe('NAM PHƯƠNG NAM');
    expect(parts.filter((p) => p.hit)).toHaveLength(2);
  });
  it('từ khoá quá ngắn hoặc không khớp thì không tô', () => {
    expect(hits('CÔNG TY A', 'a')).toEqual([]);
    expect(hits('CÔNG TY A', 'xyz')).toEqual([]);
  });
});
