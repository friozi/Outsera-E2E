import { BaseScreen } from './BaseScreen';
import { parsePrice } from './ProductsScreen';

export class CartScreen extends BaseScreen {
  get productName() {
    return this.el('product-name');
  }

  get quantity() {
    return this.el('quantity');
  }

  get itemTotal() {
    return this.el('item-total-price');
  }

  get total() {
    return this.el('total-price');
  }

  get proceedButton() {
    return this.el('proceed-button');
  }

  async waitForLoaded(): Promise<void> {
    await this.proceedButton.waitForDisplayed();
  }

  async getTotal(): Promise<number> {
    return parsePrice(await this.total.getText());
  }

  async getItemTotal(): Promise<number> {
    return parsePrice(await this.itemTotal.getText());
  }
}
