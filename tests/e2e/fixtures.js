// Fixture dùng chung cho mọi test e2e: chặn request tới Google Analytics / Tag Manager
// (bản build test có NEXT_PUBLIC_GA_ID giả) để test không phụ thuộc mạng ngoài.
// Mọi URL gtag.js bị chặn được ghi vào context.gaScriptRequests.
// Mỗi test một «IP» riêng (header X-E2E-IP, máy chủ test chỉ tin header này khi E2E_TRUST_TEST_IP=1): lớp chống crawl
// đếm lượt xem danh sách theo IP (lib/list-gate.js), không để các test cộng dồn vào nhau.
import { randomUUID } from 'node:crypto';
import { expect, test as base } from '@playwright/test';

const GOOGLE = /^https:\/\/(www\.googletagmanager\.com|[^/]*google-analytics\.com)\//;

export const test = base.extend({
  testIp: async ({}, provide) => provide(`e2e-${randomUUID()}`),
  context: async ({ context, testIp }, provide) => {
    await context.setExtraHTTPHeaders({ 'x-e2e-ip': testIp });
    context.gaScriptRequests = [];
    await context.route(GOOGLE, (route) => {
      const url = route.request().url();
      if (url.includes('/gtag/js')) context.gaScriptRequests.push(url);
      return route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: '/* gtag stub */',
      });
    });
    await provide(context);
  },
  request: async ({ playwright, baseURL, testIp }, provide) => {
    const request = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { 'x-e2e-ip': testIp },
    });
    await provide(request);
    await request.dispose();
  },
});

export { expect };
