import { BaseScreen } from './BaseScreen';
import { DrawerMenu } from './DrawerMenu';

/** Tela inicial: catálogo de produtos. Cada card repete os mesmos testIDs, então os acessamos por índice. */
export class ProductsScreen extends BaseScreen {
  get menuButton() {
    return this.el('drawer-button');
  }

  get cartButton() {
    return this.el('cart-button');
  }

  /** Contador de itens sobre o ícone do carrinho (só aparece com o carrinho não vazio). */
  get cartBadge() {
    return this.el('cart-quantity');
  }

  get productList() {
    return this.el('product-list');
  }

  async waitForLoaded(): Promise<void> {
    await this.menuButton.waitForDisplayed({ timeout: 30_000 });
    await this.all('product-title')[0].waitForDisplayed();
  }

  /**
   * Logo após uma navegação (ex.: retorno do login) o botão já aparece, mas a tela ainda está em
   * transição e o iOS pode ignorar o toque. Por isso o toque é confirmado pela abertura do menu e
   * repetido se necessário.
   */
  async openMenu(): Promise<DrawerMenu> {
    const menu = new DrawerMenu();
    await driver.waitUntil(
      async () => {
        await this.menuButton.click();
        return menu.isOpen(3_000);
      },
      { timeout: 20_000, interval: 500, timeoutMsg: 'Menu lateral não abriu' },
    );
    return menu;
  }

  async productTitle(index: number): Promise<string> {
    return this.all('product-title')[index].getText();
  }

  async productPrice(index: number): Promise<number> {
    return parsePrice(await this.all('product-price')[index].getText());
  }

  async quantity(index: number): Promise<string> {
    return this.all('quantity')[index].getText();
  }

  async increaseQuantity(index: number): Promise<void> {
    await this.all('increase-button')[index].click();
  }

  async addToCart(index: number): Promise<void> {
    await this.all('add-to-cart-button')[index].click();
    await this.cartBadge.waitForDisplayed();
  }

  async openCart(): Promise<void> {
    await this.cartButton.click();
  }
}

export function parsePrice(text: string): number {
  return Number(text.replace(/[^\d.]/g, ''));
}
