// Back/Forward trên /tim-kiem luôn khớp URL (QuerySync) và ô tìm không mở nhầm gợi ý cũ (SearchBox).
import { expect, test } from './fixtures';
import { DETAIL, acceptCookies } from './helpers';

// Ô tìm hàng 2 header (trang tỉnh): trang chủ / 404 còn ô tìm khác cùng tên trong nội dung.
const headerBox = (page) =>
  page.locator('[data-header-search]').getByRole('combobox', { name: 'Tìm doanh nghiệp' });

test.beforeEach(async ({ page }) => acceptCookies(page));

// 25 kết quả → 2 trang. Lỗi của router Next không xảy ra mọi lần → lặp vài vòng.
const SEARCH = '/tim-kiem?q=c%C3%B4ng+ty&tinh=ha-noi';

test('/tim-kiem: đổi sang trang 2 rồi Back/Forward → nội dung luôn khớp URL', async ({ page }) => {
  await page.goto(SEARCH);
  const h1 = page.getByRole('heading', { level: 1 });
  const pager = page.getByRole('navigation', { name: 'Phân trang' });
  for (let i = 0; i < 3; i++) {
    await pager.locator('a[href*="page=2"]').first().click();
    await expect(page).toHaveURL(/page=2/);
    await expect(h1).toContainText('Trang 2');
    await expect(page.getByText('Hiển thị 21–25')).toBeVisible();

    await page.goBack();
    await expect(page).not.toHaveURL(/page=2/);
    await expect(h1).not.toContainText('Trang 2');
    await expect(page.getByText('Hiển thị 1–20')).toBeVisible();
    await expect(pager.locator('[aria-current="page"]')).toHaveText(/(^|\s)1$/);

    await page.goForward();
    await expect(page).toHaveURL(/page=2/);
    await expect(h1).toContainText('Trang 2');
    await page.goBack();
    await expect(h1).not.toContainText('Trang 2');
  }
});

test('/tim-kiem: bật lọc rồi Back → bỏ lọc (ô chọn, tiêu đề về như cũ)', async ({ page }) => {
  await page.goto(SEARCH);
  const h1 = page.getByRole('heading', { level: 1 });
  const before = await h1.textContent();
  const select = page.getByLabel('Tình trạng');
  for (let i = 0; i < 2; i++) {
    if (!(await select.isVisible())) await page.getByRole('button', { name: /^Lọc/ }).click();
    await select.selectOption('active');
    await expect(page).toHaveURL(/trangthai=active/);
    await expect(select).toHaveValue('active');
    await expect(h1).not.toHaveText(before);

    await page.goBack();
    await expect(page).not.toHaveURL(/trangthai=active/);
    await expect(h1).toHaveText(before);
    await expect(select).toHaveValue('');
  }
});

test('trang tỉnh: trang 2 → Back → trang 1', async ({ page }) => {
  await page.goto('/tinh/ha-noi');
  const h1 = page.getByRole('heading', { level: 1 });
  await page
    .getByRole('navigation', { name: 'Phân trang' })
    .locator('a[href*="page=2"]')
    .first()
    .click();
  await expect(h1).toContainText('Trang 2');
  await page.goBack();
  await expect(page).not.toHaveURL(/page=2/);
  await expect(h1).not.toContainText('Trang 2');
});

test('gõ chữ mới khi gợi ý cũ còn hiện (chuột nằm trên dòng đầu) rồi Enter ngay → tìm chữ mới, không mở DN cũ', async ({
  page,
}) => {
  await page.goto('/tinh/ha-noi');
  const box = headerBox(page);
  await box.fill('ky thuat pc');
  const first = page.getByRole('option').first();
  await expect(first).toBeVisible();
  // Rê chuột lên dòng đầu: chỉ tô nền, không thành dòng được chọn.
  await first.hover();
  await expect(box).not.toHaveAttribute('aria-activedescendant', /.+/);

  // Rời ô rồi quay lại: gợi ý (đúng chữ đang có) hiện lại; gõ thêm → danh sách cũ đóng ngay.
  await box.blur();
  await expect(page.getByRole('listbox')).toBeHidden();
  await box.focus();
  await expect(first).toBeVisible();
  await first.hover();
  await box.fill('song hong');
  await expect(page.getByRole('listbox')).toBeHidden();
  await box.press('Enter');
  await expect(page).toHaveURL(/\/tim-kiem\?q=song(\+|%20)hong$/);
});

test('gợi ý: ↓ Enter vẫn mở đúng DN; Esc đóng gợi ý mà không xoá chữ', async ({ page }) => {
  await page.goto('/tinh/ha-noi');
  const box = headerBox(page);
  await box.fill('ky thuat pc');
  await expect(page.getByRole('option').first()).toBeVisible();
  await box.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(box).toHaveValue('ky thuat pc');
  // Esc lần nữa (danh sách đã đóng): input type=search mặc định xoá chữ — phải giữ nguyên.
  await box.press('Escape');
  await expect(box).toHaveValue('ky thuat pc');

  await box.press('ArrowDown');
  await expect(box).toHaveAttribute('aria-activedescendant', /.+/);
  await box.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${DETAIL}$`));
});

test('gợi ý: dòng «Xem tất cả kết quả» luôn nằm trọn trong khung danh sách', async ({ page }) => {
  await page.setViewportSize({ width: page.viewportSize().width, height: 520 });
  await page.goto('/tinh/ha-noi');
  const box = headerBox(page);
  await box.fill('cong ty');
  const list = page.getByRole('listbox');
  const all = page.getByRole('option', { name: /Xem tất cả/ });
  await expect(all).toBeVisible();
  // Chờ hiệu ứng mở danh sách / trượt dòng (translateY) chạy xong rồi mới đo.
  for (const el of [list, all])
    await el.evaluate((e) => Promise.all(e.getAnimations().map((x) => x.finished)));
  const l = await list.boundingBox();
  const a = await all.boundingBox();
  // Khoan dung 1px: toạ độ lẻ (0,1px) do làm tròn khi cuộn / hiệu ứng.
  expect(a.y).toBeGreaterThanOrEqual(l.y - 1);
  expect(a.y + a.height).toBeLessThanOrEqual(l.y + l.height + 1);
});
