import { cache } from 'react';
import { getIndustry } from './api';
import { toSlug } from './slug';

/** "4330-hoan-thien-..." → { industry, slug, givenSlug } | null */
export const resolveIndustry = cache(async (codeSlug) => {
  const m = /^(\d{4})(?:-([a-z0-9-]+))?$/.exec(codeSlug || '');
  if (!m) return null;
  const industry = await getIndustry(m[1]);
  if (!industry) return null;
  return { industry, slug: industry.slug || toSlug(industry.name), givenSlug: m[2] || '' };
});
