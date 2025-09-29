import { defineConfig, devices } from '@playwright/test';

const defaultPort = Number(process.env.E2E_UI_PORT ?? 4173);
const webUrl = process.env.E2E_UI_BASE_URL ?? `http://localhost:${defaultPort}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 5_000
  },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: webUrl,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  webServer: {
    command: `pnpm preview --port ${defaultPort} --strictPort`,
    url: `http://localhost:${defaultPort}`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_GATEWAY_URL: process.env.E2E_GATEWAY_URL ?? 'http://localhost:8080',
      VITE_CRM_URL: process.env.E2E_CRM_URL ?? 'http://localhost:8081',
      VITE_WMS_URL: process.env.E2E_WMS_URL ?? 'http://localhost:8082',
      VITE_GATEWAY_BASIC_AUTH: process.env.E2E_GATEWAY_BASIC_AUTH ?? 'admin@asfp.pro:admin123'
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chromium'] }
    }
  ]
});
