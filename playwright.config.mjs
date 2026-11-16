import { defineConfig, devices } from '@playwright/test';

// Hai chế độ:
//   npm run test:e2e      → app chạy mock bên trong (NEXT_PUBLIC_API_BASE trống), cổng 3200
//   npm run test:e2e:api  → app gọi API NGOÀI (scripts/mock-api-server.mjs đóng vai API Go, cổng 4100),
//                           cổng 3300. Cùng bộ test, không sửa code trang: kiểm tiêu chí 9.2.
const API_MODE = process.env.E2E_API === '1';
const PORT = Number(process.env.E2E_PORT || (API_MODE ? 3300 : 3200));
const API_PORT = 4100;

// GA ID giả để test việc nạp GA4 sau khi đồng ý cookie (request tới Google bị chặn trong tests/e2e/fixtures.js).
const appEnv = {
  ...process.env,
  NEXT_PUBLIC_GA_ID: 'G-TEST000000',
  ...(API_MODE
    ? { NEXT_PUBLIC_API_BASE: `http://localhost:${API_PORT}`, NEXT_PUBLIC_MOCK_SCENARIOS: '1' }
    : { NEXT_PUBLIC_API_BASE: '' }),
};

const appServer = {
  command: `npm run build && npm run start -- -p ${PORT}`,
  url: `http://localhost:${PORT}`,
  env: appEnv,
  reuseExistingServer: !process.env.CI,
  timeout: 240_000,
};

const apiServer = {
  command: 'node scripts/mock-api-server.mjs',
  url: `http://localhost:${API_PORT}/v1/provinces`,
  env: { ...process.env, MOCK_API_PORT: String(API_PORT) },
  reuseExistingServer: !process.env.CI,
  timeout: 30_000,
};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1, // mock server giữ trạng thái phiên mở số trong bộ nhớ
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: API_MODE ? [apiServer, appServer] : appServer,
});
