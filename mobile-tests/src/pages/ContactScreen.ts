import { BaseScreen } from './BaseScreen';

export interface DadosContato {
  nome: string;
  sobrenome: string;
  email: string;
  assunto?: string;
  mensagem: string;
}

export class ContactScreen extends BaseScreen {
  get firstNameInput() {
    return this.el('first-name-input');
  }

  get lastNameInput() {
    return this.el('last-name-input');
  }

  get emailInput() {
    return this.el('email-input');
  }

  get subjectPicker() {
    return this.el('subject-picker');
  }

  get messageInput() {
    return this.el('message-input');
  }

  get sendButton() {
    return this.el('send-message-button');
  }

  get emailError() {
    return this.el('email-error');
  }

  get messageError() {
    return this.el('message-error');
  }

  get successMessage() {
    return this.el('success-message');
  }

  get sendAnotherButton() {
    return this.el('send-another-button');
  }

  async waitForLoaded(): Promise<void> {
    await this.firstNameInput.waitForDisplayed();
  }

  /**
   * O seletor de assunto é um componente nativo diferente em cada plataforma:
   * Android usa um Spinner (abre uma lista de opções); iOS usa um PickerWheel embutido na tela.
   */
  private get iosPickerWheel() {
    return $('-ios class chain:**/XCUIElementTypeOther[`name == "subject-picker"`]/**/XCUIElementTypePickerWheel');
  }

  private get androidSpinnerValue() {
    return $('android=new UiSelector().resourceId("subject-picker").childSelector(new UiSelector().resourceId("android:id/text1"))');
  }

  async getSelectedSubject(): Promise<string> {
    return driver.isAndroid
      ? this.androidSpinnerValue.getText()
      : ((await this.iosPickerWheel.getAttribute('value')) ?? '');
  }

  async selectSubject(subject: string): Promise<void> {
    if (driver.isAndroid) {
      await this.subjectPicker.click();
      await this.textElement(subject).click();
    } else {
      await this.iosPickerWheel.setValue(subject);
    }
    // Aguarda a roleta parar: consultar a árvore de acessibilidade durante a animação
    // derrubou o app no iOS (ver "Observações" no README).
    await driver.waitUntil(async () => (await this.getSelectedSubject()) === subject, {
      timeoutMsg: `Assunto "${subject}" não foi selecionado`,
    });
  }

  async fill(dados: DadosContato): Promise<void> {
    await this.type('first-name-input', dados.nome);
    await this.type('last-name-input', dados.sobrenome);
    await this.type('email-input', dados.email);
    await this.hideKeyboard();
    if (dados.assunto) await this.selectSubject(dados.assunto);
    await this.type('message-input', dados.mensagem);
    await this.hideKeyboard();
  }

  /**
   * Aguarda a resposta da tela ao envio: confirmação de sucesso ou mensagem de validação.
   * Sem essa espera, uma asserção "sucesso não exibido" passaria antes de o app reagir.
   */
  async waitForSubmitResult(): Promise<'sucesso' | 'erro'> {
    let resultado: 'sucesso' | 'erro' = 'erro';
    await driver.waitUntil(
      async () => {
        if (await this.successMessage.isDisplayed()) return (resultado = 'sucesso'), true;
        return (await this.emailError.isDisplayed()) || (await this.messageError.isDisplayed());
      },
      { timeoutMsg: 'O app não exibiu confirmação nem erro após o envio do formulário' },
    );
    return resultado;
  }

  async submit(): Promise<void> {
    // No iOS o botão fica abaixo do teclado/da dobra da tela.
    await this.scrollUntilDisplayed(this.sendButton);
    await this.sendButton.click();
  }
}
