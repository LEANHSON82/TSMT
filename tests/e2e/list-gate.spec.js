// Cổng quảng cáo trước trang «Doanh nghiệp mới thành lập» (lib/list-gate.js, chủ dự án yêu cầu 25/11/2026).
import { expect, test } from './fixtures';
import { acceptCookies, getListPass } from './helpers';

const PAGE = '/doanh-nghiep-moi-thanh-lap';
const BUTTON = 'Xem quảng cáo để mở danh sách';

test('chưa có vé: HTML chỉ có màn hình cổng, không có dữ liệu DN, không cache, noindex', async ({
  request,
}) => {
  for (const path of [PAGE, `${PAGE}?page=2`, `${PAGE}?tinh=ha-noi`]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['cache-control'], path).toContain('private');
    expect(res.headers()['x-robots-tag'], path).toBe('noindex');
    const html = await res.text();
    expect(html, path).toContain(BUTTON);
    expect(html, path).not.toContain('<article');
  }
  // Vé giả / sửa chữ ký → vẫn là màn hình cổng.
  const forged = await request.get(PAGE, { headers: { cookie: 'list_pass=abc.def' } });
  expect(await forged.text()).toContain(BUTTON);
});

test('API cấp vé: thiếu kết quả quảng cáo 400, thiếu token Turnstile 403', async ({ request }) => {
  const bad = await request.post('/api/list-pass', { data: { turnstile_token: 'x' } });
  expect(bad.status()).toBe(400);
  const noToken = await request.post('/api/list-pass', { data: { ad_result: { type: 'mock' } } });
  expect(noToken.status()).toBe(403);
});

test('có vé: thấy danh sách; mỗi vé xem tối đa 40 trang rồi quay lại cổng', async ({ request }) => {
  await getListPass(request);
  const first = await request.get(PAGE);
  expect(first.headers()['cache-control']).toContain('private');
  expect(await first.text()).toContain('<article');
  for (let i = 1; i < 40; i++) expect((await request.get(`${PAGE}?page=2`)).status()).toBe(200);
  const over = await (await request.get(PAGE)).text();
  expect(over).not.toContain('<article');
  expect(over).toContain('Bạn đã xem hết 40 trang');
});

test('xem hết quảng cáo → mở đúng trang đang xem (giữ ?page=)', async ({ page }) => {
  await acceptCookies(page);
  await page.goto(`${PAGE}?page=2`);
  await expect(page.locator('article')).toHaveCount(0);
  await page.getByRole('button', { name: BUTTON }).click();
  await expect(page.getByTestId('mock-video')).toBeVisible();
  await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Trang 2');
});

test('đóng quảng cáo sớm → nhắc xem hết, nút «Xem lại»', async ({ page }) => {
  await acceptCookies(page);
  await page.goto(`${PAGE}?ad=closed`);
  await page.getByRole('button', { name: BUTTON }).click();
  await expect(page.getByText('Bạn cần xem hết quảng cáo để mở danh sách.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xem lại' })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(0);
});

test('robots.txt chặn trang sau cổng; sitemap không còn trang này', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Disallow: ${PAGE}`);
  expect(robots).toContain('Disallow: /mo-khoa');
  const index = await (await request.get('/sitemap.xml')).text();
  for (const loc of index.match(/<loc>[^<]+<\/loc>/g) || []) {
    const url = new URL(loc.slice(5, -6));
    const body = await (await request.get(url.pathname)).text();
    expect(body, url.pathname).not.toContain(`${PAGE}<`);
  }
});
