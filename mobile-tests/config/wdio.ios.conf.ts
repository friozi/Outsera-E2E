import path from 'node:path';
import { APPS_DIR, sharedConfig, platformConfig } from './wdio.shared.conf';

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  ...platformConfig({
    port: 4724,
    environment: {
      Plataforma: 'iOS',
      Dispositivo: `${process.env.IOS_DEVICE ?? 'iPhone 16 Pro'} (iOS ${process.env.IOS_VERSION ?? '18.6'}, simulador)`,
      Driver: 'XCUITest',
      App: 'ToolShop.app (practice-software-testing-mobile-app)',
    },
  }),
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': process.env.IOS_DEVICE ?? 'iPhone 16 Pro',
      'appium:platformVersion': process.env.IOS_VERSION ?? '18.6',
      'appium:app': path.join(APPS_DIR, 'ToolShop.app'),
      'appium:bundleId': 'practice-software-testing-mobile-app',
      'appium:autoAcceptAlerts': true,
      'appium:newCommandTimeout': 240,
      // A primeira execução compila o WebDriverAgent (alguns minutos).
      'appium:wdaLaunchTimeout': 600_000,
      'appium:wdaConnectionTimeout': 600_000,
    },
  ],
};
