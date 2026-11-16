import { describe, expect, it } from 'vitest';
import { industryColor, vsicSection } from '@/lib/vsic';

describe('vsicSection / industryColor', () => {
  it('xếp mã ngành vào nhóm VSIC cấp 1', () => {
    expect(vsicSection('4330')).toBe('F');
    expect(vsicSection('4610')).toBe('G');
    expect(vsicSection('6201')).toBe('J');
    expect(vsicSection('0111')).toBe('A');
    expect(vsicSection('abc')).toBeNull();
  });
  it('mã sai thì dùng màu mặc định', () => {
    expect(industryColor('xx')).toEqual({ bg: '#eef3fc', fg: '#0f3680' });
    expect(industryColor('4330').fg).toBe('#9a3412');
  });
});
