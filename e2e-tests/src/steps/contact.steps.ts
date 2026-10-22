import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';
import { ContactField } from '../pages';

const CAMPOS: Record<string, ContactField> = {
  nome: 'first-name',
  sobrenome: 'last-name',
  'e-mail': 'email',
  assunto: 'subject',
  mensagem: 'message',
};

When('eu acesso o menu {string}', async ({ header }, menu: string) => {
  expect(menu, 'menu suportado pelo step').toBe('Contact');
  await header.goToContact();
});

Given('que estou no formulário de contato', async ({ header, contactPage }) => {
  await header.goToContact();
  await expect(contactPage.heading).toBeVisible();
});

Then('devo estar na página do formulário de contato', async ({ page, contactPage }) => {
  await expect(page).toHaveURL(new RegExp(`${contactPage.path}$`));
  await expect(contactPage.heading).toBeVisible();
  await expect(contactPage.subjectSelect).toBeVisible();
  await expect(contactPage.messageInput).toBeVisible();
  await expect(contactPage.submitButton).toBeEnabled();
});

Then('o formulário deve estar identificado com os dados do cliente', async ({ contactPage, ctx }) => {
  // Usuário autenticado: a aplicação já conhece nome e e-mail, portanto não os solicita novamente.
  await expect(contactPage.greeting(`${ctx.usuario!.nome} ${ctx.usuario!.sobrenome}`)).toBeVisible();
  await expect(contactPage.field('email')).toBeHidden();
});

When(
  'eu envio a mensagem {string} com o assunto {string}',
  async ({ contactPage }, mensagem: string, assunto: string) => {
    await contactPage.sendMessage(assunto, mensagem);
  },
);

When('eu envio o formulário de contato sem preencher os campos', async ({ contactPage }) => {
  await contactPage.submitButton.click();
});

Then('devo ver a confirmação de envio {string}', async ({ contactPage }, mensagem: string) => {
  await expect(contactPage.successMessage).toHaveText(mensagem);
});

Then('o campo {string} do contato deve exibir o erro {string}', async ({ contactPage }, campo: string, mensagem: string) => {
  await expect(contactPage.fieldError(CAMPOS[campo])).toHaveText(mensagem);
});
