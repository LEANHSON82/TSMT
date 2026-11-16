import { describe, expect, it } from 'vitest';
import { toSlug, SLUG_MAX_LENGTH } from '@/lib/slug';

describe('toSlug', () => {
  it('bỏ dấu tiếng Việt và đổi đ thành d', () => {
    expect(toSlug('CÔNG TY TNHH GIẢI PHÁP KỸ THUẬT PC VIỆT NAM')).toBe(
      'cong-ty-tnhh-giai-phap-ky-thuat-pc-viet-nam',
    );
    expect(toSlug('Đắk Lắk')).toBe('dak-lak');
    expect(toSlug('đường Điện Biên Phủ')).toBe('duong-dien-bien-phu');
  });

  it('ký tự khác chữ/số thành "-" và gộp "-" liền nhau', () => {
    expect(toSlug('A & B -- C,,, D')).toBe('a-b-c-d');
    expect(toSlug('  --Hoàn thiện công trình xây dựng!!  ')).toBe('hoan-thien-cong-trinh-xay-dung');
  });

  it('cắt tối đa 80 ký tự, không để "-" ở cuối', () => {
    const long = 'Công ty cổ phần '.repeat(20);
    const slug = toSlug(long);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('xử lý giá trị rỗng', () => {
    expect(toSlug('')).toBe('');
    expect(toSlug(null)).toBe('');
    expect(toSlug(undefined)).toBe('');
  });

  it('giữ số', () => {
    expect(toSlug('Ngành 4330 – Hoàn thiện')).toBe('nganh-4330-hoan-thien');
  });
});
