import { readFileSync } from 'node:fs';

export const DETAIL = '/0319786701-cong-ty-tnhh-giai-phap-ky-thuat-pc-viet-nam';
export const FULL_PHONE = '0916 000 000';

const companies = JSON.parse(
  readFileSync(new URL('../../mocks/data/companies.json', import.meta.url)),
);
const pathOf = (c) => `/${c.mst}-${c.slug}`;
export const NO_PHONE_PATH = pathOf(companies.find((c) => !c.has_phone));
export const HIDDEN_PHONE_PATH = pathOf(companies.find((c) => c.has_phone && c.phone_hidden));
export const BRANCH_PATH = pathOf(companies.find((c) => c.parent_mst));

/** Bỏ banner cookie để không che nút. */
export async function acceptCookies(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        'cookie_consent',
        JSON.stringify({ necessary: true, analytics: true, ads: true }),
      );
    } catch {
      /* ignore */
    }
  });
}

export async function startUnlock(page) {
  await page.getByRole('button', { name: 'Xem số điện thoại' }).click();
  const dialog = page.getByRole('dialog', { name: 'Xem video ngắn để hiện số điện thoại?' });
  await dialog.waitFor();
  await dialog.getByRole('button', { name: 'Xem', exact: true }).click();
}

/** Xin vé mở danh sách bị chặn (lib/list-gate.js) cho request context / page.request — cookie lưu vào context. */
export async function getListPass(request) {
  const res = await request.post('/api/list-pass', {
    data: { ad_result: { type: 'mock' }, turnstile_token: 'e2e' },
  });
  if (res.status() !== 204) throw new Error(`list-pass ${res.status()}`);
}

export async function trackEvents(page, name) {
  return page.evaluate((n) => (window.__trackLog || []).filter((e) => e.name === n), name);
}
