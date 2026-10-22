import { expect } from '@wdio/globals';
import { ContactScreen, ProductsScreen } from '../../src/pages';
import { restartAppClean } from '../../src/support/app';
import { classificar, passo } from '../../src/support/report';
import { ASSUNTO_PADRAO, CONTATO_VALIDO, MENSAGENS } from '../../src/data/test-data';

/**
 * Tarefa 2: preenchimento e envio de formulário (Contato).
 * O formulário é acessado como visitante: para usuários autenticados o app não exibe o item "Contact".
 */
describe('Tarefa 2 - Formulário de contato', () => {
  const products = new ProductsScreen();
  const contact = new ContactScreen();

  beforeEach(async () => {
    await restartAppClean();
    await passo('Abrir o menu e acessar "Contact"', async () => {
      const menu = await products.openMenu();
      await menu.goToContact();
      await contact.waitForLoaded();
    });
  });

  it('deve exibir todos os elementos do formulário', async () => {
    await classificar({ feature: 'Contato', story: 'Elementos do formulário' });

    await passo('Validar título, campos, assunto padrão e botão de envio', async () => {
      await expect(contact.headerTitle).toHaveText('Contact Us');
      for (const campo of [contact.firstNameInput, contact.lastNameInput, contact.emailInput, contact.messageInput]) {
        await expect(campo).toBeDisplayed();
        await expect(campo).toBeEnabled();
      }
      await expect(contact.subjectPicker).toBeDisplayed();
      await expect(await contact.getSelectedSubject()).toBe(ASSUNTO_PADRAO);
      await expect(contact.sendButton).toBeEnabled();
      await expect(contact.successMessage).not.toBeDisplayed();
    });
  });

  it('deve enviar a mensagem com dados válidos', async () => {
    await classificar({ feature: 'Contato', story: 'Envio com dados válidos', severity: 'critical' });

    await passo('Preencher nome, sobrenome, e-mail, assunto e mensagem', async () => {
      await contact.fill(CONTATO_VALIDO);
      await expect(contact.firstNameInput).toHaveText(CONTATO_VALIDO.nome);
      await expect(contact.emailInput).toHaveText(CONTATO_VALIDO.email);
      await expect(await contact.getSelectedSubject()).toBe(CONTATO_VALIDO.assunto);
    });

    await passo('Enviar a mensagem', async () => {
      await contact.submit();
    });

    await passo('Validar a confirmação de envio', async () => {
      await expect(await contact.waitForSubmitResult()).toBe('sucesso');
      await expect(contact.successMessage).toBeDisplayed();
      await expect(contact.textElement(MENSAGENS.contatoEnviado)).toBeDisplayed();
      await expect(contact.sendAnotherButton).toBeDisplayed();
      await expect(contact.sendButton).not.toBeDisplayed();
    });

    await passo('Tocar em "Send another" e validar o retorno ao formulário', async () => {
      await contact.sendAnotherButton.click();
      await contact.waitForLoaded();
      await expect(contact.successMessage).not.toBeDisplayed();
      // Campo vazio: no Android o texto lido de um EditText vazio é o placeholder, por isso
      // validamos que o valor digitado anteriormente não está mais lá.
      await expect(contact.emailInput).not.toHaveText(CONTATO_VALIDO.email);
    });
  });

  it('deve exigir e-mail e mensagem ao enviar o formulário em branco', async () => {
    await classificar({ feature: 'Contato', story: 'Campos obrigatórios' });

    await passo('Enviar sem preencher os campos', async () => {
      await contact.submit();
    });

    await passo('Validar as mensagens de campo obrigatório e que nada foi enviado', async () => {
      await expect(await contact.waitForSubmitResult()).toBe('erro');
      await expect(contact.emailError).toHaveText(MENSAGENS.emailObrigatorio);
      await expect(contact.messageError).toHaveText(MENSAGENS.mensagemObrigatoria);
      await expect(contact.successMessage).not.toBeDisplayed();
    });
  });

  /**
   * Defeito encontrado (BUG-M01): o app não valida o formato do e-mail e a API v4 aceita o envio
   * (HTTP 200). A tela de login do mesmo app valida o formato, e a API v5 rejeita (HTTP 422).
   * O teste descreve o comportamento esperado e falha enquanto o defeito existir.
   */
  it('deve rejeitar e-mail com formato inválido', async () => {
    await classificar({ feature: 'Contato', story: 'Formato de e-mail', severity: 'critical' });

    await passo('Preencher o formulário com e-mail sem "@"', async () => {
      await contact.fill({ ...CONTATO_VALIDO, email: 'email-invalido' });
    });

    await passo('Enviar a mensagem', async () => {
      await contact.submit();
    });

    await passo('Validar que o e-mail é recusado e a mensagem não é enviada', async () => {
      await expect(await contact.waitForSubmitResult()).toBe('erro');
      await expect(contact.emailError).toHaveText(MENSAGENS.emailInvalido);
      await expect(contact.successMessage).not.toBeDisplayed();
    });
  });
});
