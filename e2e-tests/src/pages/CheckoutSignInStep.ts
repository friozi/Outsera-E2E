import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Passo 2 do checkout: identificação (usuário já autenticado apenas confirma). */
export class CheckoutSignInStep extends BasePage {
  get proceedButton(): Locator {
    return this.byTestId('proceed-2');
  }

  get loggedInMessage(): Locator {
    return this.page.getByText('you are already logged in');
  }

  async proceed(): Promise<void> {
    await this.loggedInMessage.waitFor();
    await this.proceedButton.click();
  }
}
