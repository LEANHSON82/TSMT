import { cache } from 'react';
import { getIndustries, getIndustry } from './api';
import { POPULAR_INDUSTRIES } from './popular-industries';
import { toSlug } from './slug';

/** "4330-hoan-thien-..." → { industry, slug, givenSlug } | null */
export const resolveIndustry = cache(async (codeSlug) => {
  const m = /^(\d{4})(?:-([a-z0-9-]+))?$/.exec(codeSlug || '');
  if (!m) return null;
  const industry = await getIndustry(m[1]);
  if (!industry) return null;
  return { industry, slug: industry.slug || toSlug(industry.name), givenSlug: m[2] || '' };
});

/** Danh mục ngành cho bộ lọc: lấy từ API, lỗi thì dùng danh sách ngành phổ biến. */
export const industryOptions = cache(async () => {
  const items = await getIndustries().catch(() => []);
  const list = items.length ? items : POPULAR_INDUSTRIES;
  return {
    industries: list,
    options: list.map((i) => ({ value: i.code, label: `${i.code} – ${i.name}` })),
    byCode: (code) => list.find((i) => i.code === code) || null,
  };
});
