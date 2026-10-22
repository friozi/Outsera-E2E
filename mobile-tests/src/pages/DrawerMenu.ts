import { BaseScreen } from './BaseScreen';

/** Menu lateral de navegação. */
export class DrawerMenu extends BaseScreen {
  get signInItem() {
    return this.el('nav-sign-in');
  }

  get registerItem() {
    return this.el('nav-register');
  }

  get contactItem() {
    return this.el('nav-contact');
  }

  /** Saudação exibida somente para usuário autenticado. */
  get welcomeMessage() {
    return this.el('nav-welcome');
  }

  get logoutItem() {
    return this.el('nav-logout');
  }

  /** Os itens do menu mudam com o login: visitante vê "Sign In"; usuário autenticado vê a saudação. */
  async isOpen(timeout: number): Promise<boolean> {
    return driver
      .waitUntil(async () => (await this.signInItem.isDisplayed()) || (await this.welcomeMessage.isDisplayed()), {
        timeout,
      })
      .catch(() => false);
  }

  async goToSignIn(): Promise<void> {
    await this.signInItem.click();
  }

  async goToContact(): Promise<void> {
    await this.contactItem.click();
  }
}
