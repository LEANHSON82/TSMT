import { cache } from 'react';
import { getProvinces } from './api';
import { sortProvinces } from './province-order';

export const provinceOptions = cache(async function provinceOptions() {
  const provinces = await getProvinces().catch(() => []);
  const sorted = sortProvinces(provinces);
  return {
    provinces: sorted,
    options: sorted.map((p) => ({ value: p.slug, label: p.name })),
    bySlug: (slug) => sorted.find((p) => p.slug === slug) || null,
  };
});
