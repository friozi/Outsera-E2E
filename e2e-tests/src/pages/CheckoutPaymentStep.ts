import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CartaoDeCredito } from '../data/test-data';

export type PaymentMethod = 'Bank Transfer' | 'Cash on Delivery' | 'Credit Card' | 'Buy Now Pay Later' | 'Gift Card';

/** Passo 4 do checkout: pagamento e finalização do pedido. */
export class CheckoutPaymentStep extends BasePage {
  get paymentMethodSelect(): Locator {
    return this.byTestId('payment-method');
  }

  /** O mesmo botão exibe "Check payment" e, após aprovação, "Confirm". */
  get finishButton(): Locator {
    return this.byTestId('finish');
  }

  get successMessage(): Locator {
    return this.byTestId('payment-success-message');
  }

  get errorMessage(): Locator {
    return this.byTestId('payment-error-message');
  }

  get validationErrors(): Locator {
    return this.page.locator('app-payment .alert-danger');
  }

  get orderConfirmation(): Locator {
    return this.page.locator('#order-confirmation');
  }

  async selectMethod(method: PaymentMethod): Promise<void> {
    await this.paymentMethodSelect.selectOption({ label: method });
  }

  async fillCreditCard(cartao: CartaoDeCredito): Promise<void> {
    await this.byTestId('credit_card_number').fill(cartao.numero);
    await this.byTestId('expiration_date').fill(cartao.validade);
    await this.byTestId('cvv').fill(cartao.cvv);
    await this.byTestId('card_holder_name').fill(cartao.titular);
    await this.byTestId('card_holder_name').blur();
  }

  async fillBankTransfer(bank: string, accountName: string, accountNumber: string): Promise<void> {
    await this.byTestId('bank_name').fill(bank);
    await this.byTestId('account_name').fill(accountName);
    await this.byTestId('account_number').fill(accountNumber);
  }

  async checkPayment(): Promise<void> {
    await expect(this.finishButton).toHaveText(/Check payment/);
    await this.finishButton.click();
  }

  async confirmOrder(): Promise<void> {
    await expect(this.finishButton).toHaveText(/Confirm/);
    await this.finishButton.click();
  }
}
