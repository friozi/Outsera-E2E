import path from 'node:path';
import { APPS_DIR, sharedConfig, platformConfig } from './wdio.shared.conf';

export const config: WebdriverIO.Config = {
  ...sharedConfig,
  ...platformConfig({
    port: 4723,
    environment: {
      Plataforma: 'Android',
      Dispositivo: process.env.ANDROID_DEVICE ?? 'Android Emulator',
      Driver: 'UiAutomator2',
      App: 'practice-software-testing.apk (io.testsmith.practicesoftwaretesting)',
    },
  }),
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.ANDROID_DEVICE ?? 'Android Emulator',
      'appium:avd': process.env.ANDROID_AVD, // opcional: inicia o emulador automaticamente
      'appium:app': path.join(APPS_DIR, 'practice-software-testing.apk'),
      'appium:appPackage': 'io.testsmith.practicesoftwaretesting',
      'appium:appActivity': '.MainActivity',
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 240,
      'appium:avdLaunchTimeout': 180_000,
    },
  ],
};
