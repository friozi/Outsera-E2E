import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductCatalogPage extends BasePage {
  get productCards(): Locator {
    return this.page.locator('a.card');
  }

  productCard(name: string): Locator {
    return this.productCards.filter({
      has: this.page.getByTestId('product-name').getByText(name, { exact: true }),
    });
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await this.productCards.first().waitFor();
  }

  async openProduct(name: string): Promise<void> {
    await this.productCard(name).first().click();
  }
}
