import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly path = '/auth/login';

  get emailInput(): Locator {
    return this.byTestId('email');
  }

  get passwordInput(): Locator {
    return this.byTestId('password');
  }

  get submitButton(): Locator {
    return this.byTestId('login-submit');
  }

  /** Erro retornado pela API (credenciais inválidas, conta bloqueada...). */
  get loginError(): Locator {
    return this.byTestId('login-error');
  }

  /** Erro de validação do formulário, exibido abaixo do campo. */
  fieldError(field: 'email' | 'password'): Locator {
    return this.byTestId(`${field}-error`);
  }

  async open(): Promise<void> {
    await this.page.goto(this.path);
    await this.emailInput.waitFor();
  }

  /** Faz login aguardando a resposta da API; retorna o status HTTP. */
  async loginAndWaitForApi(email: string, password: string): Promise<number> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().endsWith('/users/login') && r.request().method() === 'POST'),
      this.login(email, password),
    ]);
    return response.status();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
