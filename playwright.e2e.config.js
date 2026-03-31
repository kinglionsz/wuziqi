// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 *
 * E2E 测试配置 - 生成 HTML 报告
 */
export default defineConfig({
  testDir: './tests',

  /* 串行执行测试，避免状态污染 */
  fullyParallel: false,

  /* 测试 workers 数量 */
  workers: 1,

  /* CI 环境下禁止 test.only */
  forbidOnly: !!process.env.CI,

  /* CI 上重试次数 */
  retries: process.env.CI ? 2 : 0,

  /* Reporter - HTML 报告输出到 e2e-report 文件夹 */
  reporter: [
    ['html', { outputFolder: 'e2e-report', open: 'never' }],
    ['list']
  ],

  /* 共享设置 */
  use: {
    /* 基础 URL */
    baseURL: 'https://codebuddy-9gu42kpn62ead2e2-1402693592.tcloudbaseapp.com/',

    /* 超时设置 - 每个操作60秒 */
    actionTimeout: 60000,
    navigationTimeout: 120000,

    /* 失败时重试收集 trace */
    trace: 'on-first-retry',

    /* 失败时截图 */
    screenshot: 'only-on-failure',

    /* 失败时录制视频 */
    video: 'on-first-retry',

    /* 视口大小 */
    viewport: { width: 1280, height: 720 },

    /* 忽略 HTTPS 错误 (腾讯云验证页面) */
    ignoreHTTPSErrors: true,
  },

  /* 测试项目 - 只用 Chromium 加快速度 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});