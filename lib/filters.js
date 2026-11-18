// Tham số lọc nâng cao của /tim-kiem: nhiều tỉnh (?tinh=ha-noi,ho-chi-minh), nhiều ngành (?nganh=6201,4330),
// «thành lập trong» (?thanhlap=30-ngay). Nhận cả dạng lặp lại (?tinh=a&tinh=b) — form gửi khi chưa có JS.

/** Giá trị URL → mảng không trùng, bỏ rỗng. '' | 'a,b' | ['a', 'b,c'] → ['a', 'b', 'c'] */
export function listParam(raw) {
  const parts = (Array.isArray(raw) ? raw : [raw])
    .flatMap((v) => String(v ?? '').split(','))
    .map((v) => v.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

export const MAX_MULTI = 20;

// «Thành lập trong»: số ngày / tháng / năm tính lùi từ hôm nay (giờ Việt Nam).
export const FOUNDED_WITHIN = [
  { value: '7-ngay', days: 7 },
  { value: '30-ngay', days: 30 },
  { value: '3-thang', months: 3 },
  { value: '6-thang', months: 6 },
  { value: '1-nam', months: 12 },
  { value: '3-nam', months: 36 },
];

export function foundedOption(value) {
  return FOUNDED_WITHIN.find((o) => o.value === value) || null;
}

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function todayVN(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
}

/** «Thành lập trong 30 ngày» → ngày bắt đầu (YYYY-MM-DD) gửi API founded_from. Không hợp lệ → ''. */
export function foundedFrom(value, now = new Date()) {
  const opt = foundedOption(value);
  if (!opt) return '';
  const [y, m, d] = todayVN(now).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (opt.days) date.setUTCDate(date.getUTCDate() - opt.days);
  if (opt.months) {
    date.setUTCDate(1); // tránh 31/03 − 1 tháng nhảy sang 03/03
    date.setUTCMonth(date.getUTCMonth() - opt.months);
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(d, last));
  }
  return date.toISOString().slice(0, 10);
}
