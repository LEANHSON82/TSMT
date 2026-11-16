import { cache } from 'react';
import { getProvinces } from './api';

export const provinceOptions = cache(async function provinceOptions() {
  const provinces = await getProvinces().catch(() => []);
  const sorted = [...provinces].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  return {
    provinces: sorted,
    options: sorted.map((p) => ({ value: p.slug, label: p.name })),
    bySlug: (slug) => sorted.find((p) => p.slug === slug) || null,
  };
});
