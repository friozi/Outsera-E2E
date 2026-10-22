import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';
import 'dotenv/config';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['src/fixtures/index.ts', 'src/steps/**/*.ts'],
  language: 'pt',
  missingSteps: 'fail-on-gen',
});

const browsers = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
];

export default defineConfig({
  testDir,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A aplicação pública é compartilhada: um retry absorve instabilidade de rede sem mascarar falhas reais
  // (testes que só passam no retry aparecem como "flaky" no relatório).
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  outputDir: 'test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright', open: 'never' }],
    cucumberReporter('html', { outputFile: 'reports/cucumber/index.html', skipAttachments: false }),
    cucumberReporter('json', { outputFile: 'reports/cucumber/report.json' }),
    cucumberReporter('junit', { outputFile: 'reports/cucumber/junit.xml' }),
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://practicesoftwaretesting.com',
    locale: 'en-US',
    testIdAttribute: 'data-test',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: process.env.ALL_BROWSERS ? browsers : [browsers[0]],
});
