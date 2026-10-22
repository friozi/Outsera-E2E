import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export type ContactField = 'first-name' | 'last-name' | 'email' | 'subject' | 'message';

export class ContactPage extends BasePage {
  readonly path = '/contact';

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Contact' });
  }

  get subjectSelect(): Locator {
    return this.byTestId('subject');
  }

  get messageInput(): Locator {
    return this.byTestId('message');
  }

  get submitButton(): Locator {
    return this.byTestId('contact-submit');
  }

  get successMessage(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Thanks for your message' });
  }

  /** Saudação exibida no lugar dos campos de identificação quando o usuário está autenticado. */
  greeting(fullName: string): Locator {
    return this.page.getByText(`Hello ${fullName}, please fill out this form`);
  }

  field(name: ContactField): Locator {
    return this.byTestId(name);
  }

  fieldError(name: ContactField): Locator {
    return this.byTestId(`${name}-error`);
  }

  async sendMessage(subject: string, message: string): Promise<void> {
    await this.subjectSelect.selectOption({ label: subject });
    await this.messageInput.fill(message);
    await this.submitButton.click();
  }
}
