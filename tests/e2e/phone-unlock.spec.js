// Luồng xem SĐT (spec mục 4) — phủ đủ các nhánh mục 4.2 bằng mock:
// ?ad=closed|no_fill|blocked (ép kết quả quảng cáo) và ?mock=429|410|500 (ép lỗi API).
import { expect, test } from './fixtures';
import {
  DETAIL,
  FULL_PHONE,
  HIDDEN_PHONE_PATH,
  NO_PHONE_PATH,
  acceptCookies,
  startUnlock,
  trackEvents,
} from './helpers';

test.beforeEach(async ({ page }) => acceptCookies(page));

test('thành công: xem video giả lập → hiện SĐT + Gọi/Sao chép/Zalo, không tải lại trang', async ({
  page,
}) => {
  await page.goto(DETAIL);
  await expect(page.getByText('0916 *** ***', { exact: true })).toBeVisible();
  await expect(page.getByText(FULL_PHONE)).toHaveCount(0);
  await startUnlock(page);
  await expect(page.getByTestId('mock-video')).toBeVisible();
  const revealed = page.getByTestId('phone-revealed');
  await expect(revealed).toContainText(FULL_PHONE, { timeout: 10_000 });
  await expect(revealed.getByRole('link', { name: 'Gọi' })).toHaveAttribute(
    'href',
    'tel:0916000000',
  );
  await expect(revealed.getByRole('link', { name: 'Zalo' })).toHaveAttribute(
    'href',
    'https://zalo.me/0916000000',
  );
  await expect(revealed.getByRole('button', { name: 'Sao chép' })).toBeVisible();
  expect(await trackEvents(page, 'phone_unlock_success')).toHaveLength(1);

  // Cùng tab, quay lại DN đó: không phải xem lại video (sessionStorage).
  await page.reload();
  await expect(page.getByTestId('phone-revealed')).toContainText(FULL_PHONE);
});

test('huỷ hộp thoại xác nhận → về số che', async ({ page }) => {
  await page.goto(DETAIL);
  await page.getByRole('button', { name: 'Xem số điện thoại' }).click();
  const dialog = page.getByRole('dialog', { name: 'Xem video ngắn để hiện số điện thoại?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Xem', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xem số điện thoại' })).toBeEnabled();
});

test('đóng video sớm (?ad=closed) → thông báo + Xem lại, giữ số che', async ({ page }) => {
  await page.goto(`${DETAIL}?ad=closed`);
  await startUnlock(page);
  await expect(page.getByText('Bạn cần xem hết video để hiện số điện thoại.')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole('button', { name: 'Xem lại' })).toBeVisible();
  await expect(page.getByText(FULL_PHONE)).toHaveCount(0);
  expect(await trackEvents(page, 'phone_unlock_closed')).toHaveLength(1);
});

test('không có quảng cáo (?ad=no_fill) → quảng cáo dự phòng đếm ngược 5 giây → hiện SĐT', async ({
  page,
}) => {
  await page.goto(`${DETAIL}?ad=no_fill`);
  await startUnlock(page);
  await expect(page.getByTestId('fallback-countdown')).toContainText('Số điện thoại sẽ hiện sau');
  await expect(page.getByTestId('phone-revealed')).toContainText(FULL_PHONE, { timeout: 15_000 });
  const success = await trackEvents(page, 'phone_unlock_success');
  expect(success[0].params.ad_type).toBe('fallback');
  expect(await trackEvents(page, 'phone_unlock_no_fill')).toHaveLength(1);
});

test('chặn quảng cáo (?ad=blocked) → không mở số, hiện hướng dẫn', async ({ page }) => {
  await page.goto(`${DETAIL}?ad=blocked`);
  await startUnlock(page);
  await expect(page.getByText(/Vui lòng tắt chặn quảng cáo/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tải lại trang' })).toBeVisible();
  await expect(page.getByText(FULL_PHONE)).toHaveCount(0);
  // Thông tin khác vẫn xem bình thường
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('vượt giới hạn (429) → khoá nút, báo thử lại sau X phút', async ({ page }) => {
  await page.goto(`${DETAIL}?mock=429`);
  await startUnlock(page);
  await expect(
    page.getByText(/Bạn đã xem nhiều số trong thời gian ngắn\. Thử lại sau 5 phút\./),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xem số điện thoại' })).toBeDisabled();
  await expect(page.getByTestId('mock-video')).toHaveCount(0);
});

test('unlock_id hết hạn (410) → tự tạo phiên mới, không bắt xem lại video', async ({ page }) => {
  await page.goto(`${DETAIL}?mock=410`);
  await startUnlock(page);
  await expect(page.getByTestId('phone-revealed')).toContainText(FULL_PHONE, { timeout: 15_000 });
  expect(await trackEvents(page, 'phone_unlock_ad_shown')).toHaveLength(1);
  // Spec 8.1: phone_unlock_error ghi cả 410 (dù FE tự tạo phiên mới, người dùng không phải xem lại video).
  const errors = await trackEvents(page, 'phone_unlock_error');
  expect(errors).toHaveLength(1);
  expect(JSON.stringify(errors[0])).toContain('410');
});

test('lỗi server (500) sau khi xem xong → Thử lại lấy được số, không phải xem lại video', async ({
  page,
}) => {
  await page.goto(`${DETAIL}?mock=500`);
  await startUnlock(page);
  await expect(page.getByText('Không tải được số, bấm để thử lại.')).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByTestId('phone-revealed')).toContainText(FULL_PHONE, { timeout: 10_000 });
  expect(await trackEvents(page, 'phone_unlock_ad_shown')).toHaveLength(1);
});

test('DN không có SĐT / đã yêu cầu ẩn → không có nút, không chạy quảng cáo', async ({ page }) => {
  await page.goto(NO_PHONE_PATH);
  await expect(page.getByText('Chưa có thông tin')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xem số điện thoại' })).toHaveCount(0);
  await page.goto(HIDDEN_PHONE_PATH);
  await expect(page.getByText('Doanh nghiệp đã yêu cầu ẩn')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xem số điện thoại' })).toHaveCount(0);
});

test('analytics không bao giờ chứa SĐT', async ({ page }) => {
  await page.goto(DETAIL);
  await startUnlock(page);
  await expect(page.getByTestId('phone-revealed')).toContainText(FULL_PHONE, { timeout: 10_000 });
  await page
    .getByTestId('phone-revealed')
    .getByRole('button', { name: 'Sao chép' })
    .click()
    .catch(() => {});
  const log = await page.evaluate(() => JSON.stringify(window.__trackLog || []));
  expect(log).not.toContain('0916000000');
  expect(log).not.toContain('0916 000 000');
});
