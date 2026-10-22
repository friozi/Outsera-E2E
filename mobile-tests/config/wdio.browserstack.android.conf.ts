import path from 'node:path';
import { APPS_DIR, combine, reportEnvironment, sharedConfig } from './wdio.shared.conf';
import { browserstackHooks, buildName, credentials } from './browserstack';

const { user, key } = credentials();
const device = process.env.BROWSERSTACK_DEVICE ?? 'Google Pixel 8';
const osVersion = process.env.BROWSERSTACK_OS_VERSION ?? '14.0';
// Appium 3.x: necessário para os comandos "mobile:" usados na suíte (a versão padrão do BrowserStack é 1.22).
const appiumVersion = process.env.BROWSERSTACK_APPIUM_VERSION ?? '3.5.2';

/** Android em dispositivo real no BrowserStack App Automate. */
export const config = combine(
  sharedConfig,
  reportEnvironment({
    Plataforma: 'Android',
    Execução: `BrowserStack App Automate (Appium ${appiumVersion})`,
    Dispositivo: `${device} (Android ${osVersion}, dispositivo real)`,
    Driver: 'UiAutomator2',
    App: 'practice-software-testing.apk (io.testsmith.practicesoftwaretesting)',
  }),
  browserstackHooks(path.join(APPS_DIR, 'practice-software-testing.apk')),
  {
    user,
    key,
    hostname: 'hub.browserstack.com',
    port: 443,
    protocol: 'https',
    path: '/wd/hub',
    capabilities: [
      {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:autoGrantPermissions': true,
        'appium:newCommandTimeout': 240,
        'bstack:options': {
          deviceName: device,
          osVersion,
          appiumVersion,
          projectName: 'Outsera E2E - Toolshop mobile',
          buildName: buildName(),
          debug: true, // capturas de tela automáticas no painel
          networkLogs: true,
          deviceLogs: true,
          appiumLogs: true,
          video: true,
        },
      },
    ],
  },
);
