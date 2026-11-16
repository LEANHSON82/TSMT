// Fixture dùng chung cho mọi test e2e: chặn request tới Google Analytics / Tag Manager
// (bản build test có NEXT_PUBLIC_GA_ID giả) để test không phụ thuộc mạng ngoài.
// Mọi URL gtag.js bị chặn được ghi vào context.gaScriptRequests.
import { expect, test as base } from '@playwright/test';

const GOOGLE = /^https:\/\/(www\.googletagmanager\.com|[^/]*google-analytics\.com)\//;

export const test = base.extend({
  context: async ({ context }, provide) => {
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
});

export { expect };
