import { BaseScreen } from './BaseScreen';

export class LoginScreen extends BaseScreen {
  get emailInput() {
    return this.el('email-input');
  }

  get passwordInput() {
    return this.el('password-input');
  }

  get loginButton() {
    return this.el('login-button');
  }

  /** Erro retornado pela API (ex.: credenciais inválidas). */
  get errorMessage() {
    return this.el('error');
  }

  get emailError() {
    return this.el('email-error');
  }

  get passwordError() {
    return this.el('password-error');
  }

  async waitForLoaded(): Promise<void> {
    await this.loginButton.waitForDisplayed();
  }

  async login(email: string, password: string): Promise<void> {
    await this.type('email-input', email);
    await this.type('password-input', password);
    await this.hideKeyboard();
    await this.loginButton.click();
  }
}
