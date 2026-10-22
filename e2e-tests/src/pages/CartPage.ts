import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Passo 1 do checkout: carrinho. */
export class CartPage extends BasePage {
  readonly path = '/checkout';

  get rows(): Locator {
    return this.page.locator('table tbody tr');
  }

  get total(): Locator {
    return this.byTestId('cart-total');
  }

  row(productName: string): Locator {
    return this.rows.filter({ has: this.byTestId('product-title').getByText(productName) });
  }

  quantityOf(productName: string): Locator {
    return this.row(productName).getByTestId('product-quantity');
  }

  async getTotal(): Promise<number> {
    return parsePrice(await this.total.innerText());
  }

  async proceed(): Promise<void> {
    await this.byTestId('proceed-1').click();
  }
}

export function parsePrice(text: string): number {
  return Number(text.replace(/[^\d.]/g, ''));
}
