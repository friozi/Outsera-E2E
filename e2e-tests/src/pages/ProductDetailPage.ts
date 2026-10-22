import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductDetailPage extends BasePage {
  get productName(): Locator {
    return this.byTestId('product-name');
  }

  get unitPrice(): Locator {
    return this.byTestId('unit-price');
  }

  get quantityInput(): Locator {
    return this.byTestId('quantity');
  }

  get addToCartButton(): Locator {
    return this.byTestId('add-to-cart');
  }

  get addedToCartToast(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Product added to shopping cart' });
  }

  async getUnitPrice(): Promise<number> {
    return Number(await this.unitPrice.innerText());
  }

  async addToCart(quantity: number): Promise<void> {
    await this.quantityInput.fill(String(quantity));
    await this.addToCartButton.click();
    await this.addedToCartToast.first().waitFor();
  }
}
