import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  retries: 1,
  workers: 1,
  reporter: [['list'], ['html']],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});