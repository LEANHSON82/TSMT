import { describe, expect, it } from 'vitest';
import { buildIndex, countByField, search } from '../../mocks/search.js';
import { findProvinceInQuery, suggestProvinces } from '@/lib/search-intent';

const co = (mst, name, representative, extra = {}) => ({
  mst,
  name,
  representative,
  founded_date: '2024-01-01',
  has_phone: true,
  phone_hidden: false,
  ...extra,
});
const companies = [
  co('0000000001', 'CÔNG TY TNHH PHẦN MỀM LẠNG SƠN', 'HOÀNG NGỌC QUÂN'),
  co('0000000002', 'CÔNG TY TNHH THỰC PHẨM VIỆT TIẾN', 'BÙI ĐỨC SƠN'),
  co('0000000003', 'CÔNG TY CỔ PHẦN XÂY DỰNG SÔNG HỒNG', 'ĐỖ ĐỨC LAN'),
  co('0000000004', 'CÔNG TY TNHH SỞN TÓC', 'TRẦN VĂN AN'),
  co('0000000005', 'CÔNG TY TNHH AN PHÁT', 'LÊ THỊ HOA', { phone_hidden: true }),
];
const phones = { '0000000002': '0901000002', '0000000005': '0901000005' };
const index = buildIndex(companies, phones);
const msts = (r) => r.map((x) => x.c.mst);

describe('bộ tìm mẫu (mocks/search.js)', () => {
  it('gõ có dấu: người đại diện đúng dấu xếp trên tên DN sai dấu («NGUYỄN» trước «THẢO NGUYÊN»)', () => {
    const ix = buildIndex(
      [
        co('0000000011', 'CÔNG TY TNHH VẬN TẢI THẢO NGUYÊN', 'LÊ VĂN BA'),
        co('0000000012', 'CÔNG TY TNHH AN BÌNH', 'NGUYỄN THỊ LAN'),
      ],
      {},
    );
    const r = search(ix, 'NGUYỄN');
    expect(msts(r)).toEqual(['0000000012', '0000000011']);
    expect(r[0].matched).toBe('representative');
  });
  it('«Sơn»: khớp nguyên chữ, ghi rõ khớp tên hay người đại diện; không kéo theo «Sông»', () => {
    const r = search(index, 'Sơn');
    expect(msts(r)).not.toContain('0000000003');
    expect(r.find((x) => x.c.mst === '0000000001').matched).toBe('name');
    expect(r.find((x) => x.c.mst === '0000000002').matched).toBe('representative');
  });
  it('gõ có dấu thì đúng dấu xếp trên («Sơn» trước «Sởn»)', () => {
    const r = msts(search(index, 'Sơn'));
    expect(r.indexOf('0000000001')).toBeLessThan(r.indexOf('0000000004'));
  });
  it('gợi ý (đang gõ dở) cho khớp phần đầu chữ cuối', () => {
    expect(msts(search(index, 'son', { mode: 'suggest' }))).toContain('0000000003');
    expect(msts(search(index, 'bui du', { mode: 'suggest' }))).toEqual(['0000000002']);
  });
  it('không có kết quả nguyên chữ thì trang kết quả dùng khớp phần đầu', () => {
    expect(msts(search(index, 'xây dựn'))).toEqual(['0000000003']);
  });
  it('bỏ chữ chung «công ty», «TNHH» khi so khớp', () => {
    expect(msts(search(index, 'công ty tnhh việt tiến'))).toEqual(['0000000002']);
  });
  it('tìm theo SĐT công khai được; SĐT đã ẩn thì không', () => {
    expect(search(index, '0901000002')).toMatchObject([{ matched: 'phone' }]);
    expect(search(index, '0901000005')).toEqual([]);
  });
  it('bỏ chữ viết tắt «cty»', () => {
    expect(msts(search(index, 'cty việt tiến'))).toEqual(['0000000002']);
  });
  it('MST dán kèm nhãn hoặc gạch dài vẫn tìm được', () => {
    expect(search(index, 'MST: 0000000004')[0]).toMatchObject({ matched: 'mst' });
  });
  it('MST: tiền tố, khớp đúng xếp trước', () => {
    expect(search(index, '0000000004')[0]).toMatchObject({ matched: 'mst' });
  });
  it('đếm theo nhóm «Tìm theo»', () => {
    expect(countByField(search(index, 'Sơn'))).toMatchObject({ name: 2, representative: 1 });
  });
});

const provinces = [
  { code: '01', name: 'Hà Nội', slug: 'ha-noi', company_count: 29 },
  { code: '79', name: 'TP Hồ Chí Minh', slug: 'ho-chi-minh', company_count: 54 },
  { code: '20', name: 'Lạng Sơn', slug: 'lang-son', company_count: 2 },
  { code: '14', name: 'Sơn La', slug: 'son-la', company_count: 2 },
];

describe('tỉnh/thành trong từ khoá', () => {
  it('gợi ý tỉnh khi gõ', () => {
    expect(
      suggestProvinces('Sơn', provinces)
        .map((p) => p.slug)
        .sort(),
    ).toEqual(['lang-son', 'son-la']);
    expect(suggestProvinces('ho chi', provinces).map((p) => p.slug)).toEqual(['ho-chi-minh']);
    expect(suggestProvinces('0319', provinces)).toEqual([]);
  });
  it('tách tên tỉnh khỏi từ khoá', () => {
    expect(findProvinceInQuery('xây dựng hà nội', provinces)).toMatchObject({
      province: { code: '01' },
      rest: 'xây dựng',
    });
    expect(findProvinceInQuery('phần mềm tp hcm', provinces)).toMatchObject({
      province: { code: '79' },
      rest: 'phần mềm',
    });
    expect(findProvinceInQuery('thực phẩm việt tiến', provinces)).toBeNull();
  });
  it('nhận tên tỉnh cũ trước sáp nhập', () => {
    expect(suggestProvinces('binh duong', provinces).map((p) => p.slug)).toEqual(['ho-chi-minh']);
    expect(suggestProvinces('vũng tàu', provinces).map((p) => p.slug)).toEqual(['ho-chi-minh']);
    expect(findProvinceInQuery('xây dựng bình dương', provinces)).toMatchObject({
      province: { code: '79' },
      rest: 'xây dựng',
    });
  });
});
