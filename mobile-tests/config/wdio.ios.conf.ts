import path from 'node:path';
import { APPS_DIR, combine, reportEnvironment, sharedConfig } from './wdio.shared.conf';
import { LOCAL_APPIUM_VERSION, localAppium } from './local-appium';

const device = process.env.IOS_DEVICE ?? 'iPhone 16 Pro';
const version = process.env.IOS_VERSION ?? '18.6';

/**
 * iOS em simulador local (ou no runner macOS do CI). O build oficial do app é somente para
 * simulador (sem assinatura para aparelhos), por isso o iOS não roda em nuvem de dispositivos reais.
 */
export const config = combine(
  sharedConfig,
  localAppium(4724),
  reportEnvironment({
    Plataforma: 'iOS',
    Execução: `Local (Appium ${LOCAL_APPIUM_VERSION})`,
    Dispositivo: `${device} (iOS ${version}, simulador)`,
    Driver: 'XCUITest',
    App: 'ToolShop.app (practice-software-testing-mobile-app)',
  }),
  {
    capabilities: [
      {
        platformName: 'iOS',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': device,
        'appium:platformVersion': version,
        'appium:app': path.join(APPS_DIR, 'ToolShop.app'),
        'appium:bundleId': 'practice-software-testing-mobile-app',
        'appium:autoAcceptAlerts': true,
        'appium:newCommandTimeout': 240,
        // A primeira execução compila o WebDriverAgent (alguns minutos).
        'appium:wdaLaunchTimeout': 600_000,
        'appium:wdaConnectionTimeout': 600_000,
      },
    ],
  },
);
