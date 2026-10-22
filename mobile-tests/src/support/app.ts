import { byTestId } from './selectors';

const ANDROID_PACKAGE = 'io.testsmith.practicesoftwaretesting';
const IOS_BUNDLE_ID = 'practice-software-testing-mobile-app';

/**
 * Reinicia o app com os dados limpos (sessão de login, carrinho, favoritos), garantindo
 * que cada teste comece do mesmo estado e não dependa da ordem de execução.
 */
export async function restartAppClean(): Promise<void> {
  if (driver.isAndroid) {
    await driver.execute('mobile: clearApp', { appId: ANDROID_PACKAGE });
    await driver.activateApp(ANDROID_PACKAGE);
  } else {
    await driver.terminateApp(IOS_BUNDLE_ID);
    await driver.execute('mobile: clearApp', { bundleId: IOS_BUNDLE_ID });
    await driver.activateApp(IOS_BUNDLE_ID);
  }
  await $(byTestId('drawer-button')).waitForDisplayed({ timeout: 60_000 });
}
