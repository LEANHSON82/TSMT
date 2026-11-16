// Tiêu chí nghiệm thu mục 9.2 (phần kiểm được bằng mock).
import { expect, test } from './fixtures';
import { BRANCH_PATH, DETAIL, FULL_PHONE, acceptCookies } from './helpers';

test.beforeEach(async ({ page }) => acceptCookies(page));

test('HTML server trả về có tên, MST, địa chỉ, ngành nghề và KHÔNG có SĐT đầy đủ', async ({
  request,
}) => {
  const res = await request.get(DETAIL);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('CÔNG TY TNHH GIẢI PHÁP KỸ THUẬT PC VIỆT NAM');
  expect(html).toContain('0319786701');
  expect(html).toContain('75N/2A Đường số 2');
  expect(html).toContain('Hoàn thiện công trình xây dựng');
  expect(html).not.toContain(FULL_PHONE);
  expect(html).not.toContain('0916000000');
  expect(html).toContain('"@type":"Organization"');
  expect(html).not.toMatch(/"telephone"/);
  expect(html).toMatch(
    /<link rel="canonical" href="[^"]*\/0319786701-cong-ty-tnhh-giai-phap-ky-thuat-pc-viet-nam"/,
  );
});

test('/{mst}, slug sai, ngành sai slug → 301 về URL chuẩn (giữ tham số); sai/không tồn tại → 404 có đủ HTML', async ({
  request,
}) => {
  for (const [path, target] of [
    ['/0319786701', DETAIL],
    ['/0319786701-sai-slug?ad=closed', `${DETAIL}?ad=closed`],
    ['/nganh/4330', '/nganh/4330-hoan-thien-cong-trinh-xay-dung'],
    ['/nganh/4330-sai', '/nganh/4330-hoan-thien-cong-trinh-xay-dung'],
  ]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(301);
    const loc = new URL(res.headers().location, 'http://x'); // Location có thể là đường dẫn tương đối
    expect(loc.pathname + loc.search).toBe(target);
  }
  for (const path of [
    '/0000000000',
    '/12345-abc',
    '/abc',
    '/tinh/khong-co',
    '/nganh/9999-abc',
    '/tinh/ha-noi?page=999',
    '/doanh-nghiep-moi-thanh-lap?page=500',
  ]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(404);
    // HTML server trả về đã có nội dung trang 404 (không phải khung trống chờ JS).
    const html = await res.text();
    expect(html, path).toContain('Lỗi 404');
    expect(html, path).toContain('role="combobox"');
  }
});

test('trang danh sách có ?page= / ?tinh= được cache ISR (lượt sau HIT), ?tinh= sai bị bỏ', async ({
  request,
}) => {
  for (const path of [
    '/tinh/ha-noi',
    '/tinh/ha-noi?page=2',
    '/doanh-nghiep-moi-thanh-lap?tinh=ha-noi',
  ]) {
    await request.get(path);
    const res = await request.get(path);
    expect(res.headers()['x-nextjs-cache'], path).toBe('HIT');
  }
  const res = await request.get('/doanh-nghiep-moi-thanh-lap?tinh=khong-co&page=2', {
    maxRedirects: 0,
  });
  expect(res.status()).toBe(301);
  expect(res.headers().location).toContain('/doanh-nghiep-moi-thanh-lap?page=2');
});

test('ô tìm ở trang chủ tự focus trên máy tính, không tự focus trên điện thoại (spec 3.1)', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const box = page.locator('[data-hero-search] input');
  if (isMobile) await expect(box).not.toBeFocused();
  else await expect(box).toBeFocused();
});

test('trang chủ có BreadcrumbList JSON-LD (spec 7.1)', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('"@type":"BreadcrumbList"');
});

test('nhập MST hợp lệ vào ô tìm → vào thẳng trang DN', async ({ page }) => {
  await page.goto('/');
  const box = page.getByRole('combobox', { name: 'Tìm doanh nghiệp' });
  await box.fill('0319786701');
  await box.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${DETAIL}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'CÔNG TY TNHH GIẢI PHÁP KỸ THUẬT PC VIỆT NAM',
  );
});

test('gợi ý khi gõ (tối đa 8), dùng phím ↓ Enter', async ({ page }) => {
  await page.goto('/');
  const box = page.getByRole('combobox', { name: 'Tìm doanh nghiệp' });
  await box.fill('ky thuat pc');
  const options = page.getByRole('option');
  await expect(options.first()).toBeVisible();
  expect(await options.count()).toBeLessThanOrEqual(8);
  await box.press('ArrowDown');
  await expect(box).toHaveAttribute('aria-activedescendant', /.+/);
  await box.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${DETAIL}$`));
});

test('tìm theo tên → trang kết quả có lọc gắn URL', async ({ page }) => {
  await page.goto('/tim-kiem?q=c%C3%B4ng%20ty');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('kết quả cho “công ty”');
  const select = page.getByLabel('Tình trạng');
  if (!(await select.isVisible())) await page.getByRole('button', { name: /Lọc/ }).click();
  await select.selectOption('active');
  await expect(page).toHaveURL(/trangthai=active/);
  await page.goBack();
  await expect(page).not.toHaveURL(/trangthai=active/);
});

test('trang danh sách tỉnh: 20 dòng/trang, phân trang số, banner sau dòng 5 và 15', async ({
  page,
}) => {
  await page.goto('/tinh/ho-chi-minh');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Doanh nghiệp tại TP Hồ Chí Minh',
  );
  await expect(page.locator('main ol > li article')).toHaveCount(20);
  await expect(page.locator('main ol aside[aria-label="Quảng cáo"]')).toHaveCount(2);
  await page
    .getByRole('navigation', { name: 'Phân trang' })
    .getByRole('link', { name: 'Trang sau' })
    .click();
  await expect(page).toHaveURL(/page=2/);
});

test('trang chi nhánh hiện nhãn Chi nhánh và đơn vị chủ quản', async ({ page }) => {
  await page.goto(BRANCH_PATH);
  await expect(page.getByText('Chi nhánh', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('CHI NHÁNH');
  await expect(page.getByText('Đơn vị chủ quản')).toBeVisible();
});

test('form yêu cầu: báo lỗi ngay khi nhập, gửi xong có mã yêu cầu', async ({ page }) => {
  await page.goto('/yeu-cau-cap-nhat?mst=0319786701');
  await expect(page.getByLabel('Mã số thuế *')).toHaveValue('0319786701');
  await page.getByLabel(/Email liên hệ/).fill('sai-email');
  await page.getByLabel(/Email liên hệ/).blur();
  await expect(page.getByText('Email không hợp lệ.')).toBeVisible();
  await page.getByLabel(/Loại yêu cầu/).selectOption('hide_phone');
  await page.getByLabel(/Họ tên người gửi/).fill('Nguyễn Văn A');
  await page.getByLabel(/Email liên hệ/).fill('a@example.com');
  await page.getByLabel(/Nội dung/).fill('Đề nghị ẩn số điện thoại của công ty.');
  await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
  await expect(page.getByTestId('request-code')).toHaveText(/^YC-2026-\d{6}$/);
});

test('chạy đúng ở 360, 768, 1280 px: không có thanh cuộn ngang', async ({ page }) => {
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of [
      '/',
      DETAIL,
      '/tim-kiem?q=cong%20ty',
      '/tinh/ha-noi',
      '/yeu-cau-cap-nhat',
    ]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${path} @ ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test('header dính đầu trang: ô tìm luôn trong màn hình (trang chủ: hiện khi cuộn qua ô tìm lớn)', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const headerSearch = page.locator('[data-header-search]');
  await expect(headerSearch).toBeHidden(); // ô tìm lớn ở hero đang hiện
  // Máy tính: ô tìm lớn tự focus sau khi trang tải (spec 3.1) và kéo trang về đầu — chờ xong rồi mới cuộn.
  if (!isMobile) await expect(page.locator('[data-hero-search] input')).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect(headerSearch).toBeVisible();

  await page.goto(DETAIL);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(headerSearch).toBeVisible();
  const box = await headerSearch.locator('input').boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeLessThan(64);
});

test('ô tìm: không có gợi ý thì báo ngay dưới ô, Enter vẫn tìm được', async ({ page }) => {
  await page.goto('/');
  const box = page.locator('[data-hero-search] input');
  await box.fill('zzzzqq');
  await expect(page.getByText('Không có gợi ý cho “zzzzqq”').first()).toBeVisible();
  await box.press('Enter');
  await expect(page).toHaveURL(/\/tim-kiem\?q=zzzzqq/);
});

test('header đánh dấu trang đang xem (aria-current)', async ({ page, isMobile }) => {
  await page.goto('/doanh-nghiep-moi-thanh-lap');
  if (isMobile) await page.getByRole('button', { name: 'Mở menu' }).click();
  await expect(
    // Máy tính: «DN mới» (spec mục 3); menu điện thoại: «DN mới thành lập».
    page.getByRole('link', { name: /^DN mới( thành lập)?$/ }).locator('visible=true'),
  ).toHaveAttribute('aria-current', 'page');
});

test('thẻ DN: bấm vào chỗ bất kỳ trên thẻ (không chỉ tên) cũng mở DN', async ({
  page,
  isMobile,
}) => {
  await page.goto('/tinh/ha-noi');
  const card = page.locator('article').first();
  const href = await card.getByRole('link').getAttribute('href');
  const box = await card.boundingBox();
  // Bấm gần góc dưới bên phải thẻ (vùng ngày hoạt động), không phải chữ tên DN.
  const x = box.x + box.width - 12;
  const y = box.y + box.height - 8;
  if (isMobile) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await expect(page).toHaveURL(new RegExp(`${href}$`));
});

test('gõ vào ô tìm trên nav không làm trang tự cuộn (header dính)', async ({ page, isMobile }) => {
  await page.goto('/');
  // Máy tính: ô tìm lớn tự focus sau khi trang tải (spec 3.1) — chờ xong rồi mới cuộn.
  if (!isMobile) await expect(page.locator('[data-hero-search] input')).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, 900));
  const headerInput = page.locator('[data-header-search] input');
  await expect(headerInput).toBeVisible();
  const before = await page.evaluate(() => window.scrollY);
  await headerInput.click();
  await page.keyboard.type('xay dung');
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

test('danh sách gợi ý ở ô tìm trang chủ không bị khung hero cắt', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('[data-hero-search] input');
  await input.click();
  await input.pressSequentially('son', { delay: 50 });
  const last = page.locator('[data-hero-search] [role=option]').last();
  await expect(last).toBeVisible();
  // Điểm giữa gợi ý cuối cùng phải thuộc danh sách gợi ý (không bị phần tử khác che / cắt).
  const box = await last.boundingBox();
  const onTop = await page.evaluate(
    ({ x, y }) => !!document.elementFromPoint(x, y)?.closest('[role=listbox]'),
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
  expect(onTop).toBe(true);
});
