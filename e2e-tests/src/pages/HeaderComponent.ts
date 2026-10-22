import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Barra de navegação, presente em todas as páginas. */
export class HeaderComponent extends BasePage {
  get userMenu(): Locator {
    return this.byTestId('nav-menu');
  }

  get signInLink(): Locator {
    return this.byTestId('nav-sign-in');
  }

  get cartQuantity(): Locator {
    return this.byTestId('cart-quantity');
  }

  async goToContact(): Promise<void> {
    await this.byTestId('nav-contact').click();
  }

  async goToCart(): Promise<void> {
    await this.byTestId('nav-cart').click();
  }
}
