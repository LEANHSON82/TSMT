// GA4 (spec mục 8.1, 8.3, tiêu chí 9.2): chỉ nạp sau khi đồng ý cookie, gửi đủ 11 sự kiện,
// không sự kiện nào chứa SĐT hay email. Bản build test dùng NEXT_PUBLIC_GA_ID=G-TEST000000;
// request tới Google bị chặn trong fixtures.js, sự kiện được đọc từ window.dataLayer.
import { expect, test } from './fixtures';
import { DETAIL, FULL_PHONE, acceptCookies, startUnlock } from './helpers';

const PHONE_DIGITS = '0916000000';

/** Các lệnh gtag('event', ...) đã vào dataLayer của trang. */
function gaEvents(page) {
  return page.evaluate(() =>
    (window.dataLayer || [])
      .map((args) => Array.from(args))
      .filter((a) => a[0] === 'event')
      .map(([, name, params]) => ({ name, params })),
  );
}

test('chưa đồng ý cookie → không tải GA, không gửi sự kiện', async ({ page, context }) => {
  await page.goto(DETAIL);
  await expect(page.getByRole('region', { name: 'Thông báo cookie' })).toBeVisible();
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
  expect(context.gaScriptRequests).toHaveLength(0);
  expect(await gaEvents(page)).toHaveLength(0);
});

test('bấm Đồng ý → tải gtag.js với đúng GA ID, sự kiện sau đó vào GA', async ({
  page,
  context,
}) => {
  await page.goto(DETAIL);
  await page
    .getByRole('region', { name: 'Thông báo cookie' })
    .getByRole('button', { name: 'Đồng ý' })
    .click();
  await expect.poll(() => context.gaScriptRequests.length).toBe(1);
  expect(context.gaScriptRequests[0]).toContain('id=G-TEST000000');
  await page.getByRole('button', { name: 'Xem số điện thoại' }).click();
  await expect
    .poll(async () => (await gaEvents(page)).map((e) => e.name))
    .toContain('phone_unlock_click');
});

test('đủ 11 sự kiện mục 8.1 với đúng tham số, không sự kiện nào chứa SĐT/email', async ({
  context,
}) => {
  test.setTimeout(90_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const all = [];

  // Mỗi bước mở tab mới: sessionStorage (SĐT đã mở) không mang sang, dataLayer bắt đầu lại.
  async function step(url, action) {
    const page = await context.newPage();
    await acceptCookies(page);
    await page.goto(url);
    await action(page);
    all.push(...(await gaEvents(page)));
    await page.close();
  }

  await step('/tim-kiem?q=x%C3%A2y%20d%E1%BB%B1ng', async (page) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('kết quả');
    // Sự kiện search gửi sau khi trang hydrate (TrackOnMount), tiêu đề thì có sẵn trong HTML: phải chờ.
    await expect.poll(async () => (await gaEvents(page)).map((e) => e.name)).toContain('search');
  });

  await step(DETAIL, async (page) => {
    await startUnlock(page);
    const revealed = page.getByTestId('phone-revealed');
    await expect(revealed).toContainText(FULL_PHONE, { timeout: 10_000 });
    await revealed.getByRole('button', { name: 'Sao chép' }).click();
    await expect(revealed.getByRole('button', { name: 'Đã sao chép' })).toBeVisible(); // sự kiện gửi sau khi chép xong
  });

  await step(`${DETAIL}?ad=closed`, async (page) => {
    await startUnlock(page);
    await expect(page.getByRole('button', { name: 'Xem lại' })).toBeVisible({ timeout: 10_000 });
  });

  await step(`${DETAIL}?ad=no_fill`, async (page) => {
    await startUnlock(page);
    await expect(page.getByTestId('phone-revealed')).toContainText(FULL_PHONE, {
      timeout: 15_000,
    });
  });

  await step(`${DETAIL}?ad=blocked`, async (page) => {
    await startUnlock(page);
    await expect(page.getByText(/Vui lòng tắt chặn quảng cáo/)).toBeVisible();
  });

  await step(`${DETAIL}?mock=429`, async (page) => {
    await startUnlock(page);
    await expect(page.getByText(/Thử lại sau 5 phút/)).toBeVisible();
  });

  await step('/yeu-cau-cap-nhat?mst=0319786701', async (page) => {
    await page.getByLabel(/Loại yêu cầu/).selectOption('hide_phone');
    await page.getByLabel(/Họ tên người gửi/).fill('Nguyễn Văn A');
    await page.getByLabel(/Email liên hệ/).fill('a@example.com');
    await page.getByLabel(/Nội dung/).fill('Đề nghị ẩn số điện thoại của công ty.');
    await page.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByTestId('request-code')).toBeVisible();
  });

  const first = (name) => all.find((e) => e.name === name)?.params;
  const expected = {
    search: ['query_type', 'result_count'],
    view_company: ['mst', 'province'],
    phone_unlock_click: ['mst'],
    phone_unlock_ad_shown: ['mst', 'ad_type'],
    phone_unlock_closed: ['mst'],
    phone_unlock_no_fill: ['mst', 'device'],
    phone_unlock_blocked: ['mst'],
    phone_unlock_success: ['mst', 'ad_type'],
    phone_unlock_error: ['mst', 'error_code'],
    phone_action: ['mst', 'action'],
    update_request_submit: ['request_type'],
  };
  for (const [name, keys] of Object.entries(expected)) {
    const params = first(name);
    expect(params, `thiếu sự kiện ${name}`).toBeTruthy();
    for (const key of keys) expect(params, `${name} thiếu tham số ${key}`).toHaveProperty(key);
  }
  expect(first('search').query_type).toBe('text');
  expect(first('phone_action').action).toBe('copy');

  const dump = JSON.stringify(all);
  expect(dump).not.toContain(PHONE_DIGITS);
  expect(dump).not.toContain(FULL_PHONE);
  expect(dump).not.toMatch(/[^\s"@]+@[^\s"@]+\.[a-z]{2,}/i);
});
