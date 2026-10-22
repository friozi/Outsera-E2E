import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';

Given('que estou na página de login', async ({ loginPage }) => {
  await loginPage.open();
});

When('eu faço login com as credenciais do cliente', async ({ loginPage, ctx }) => {
  await loginPage.login(ctx.usuario!.email, ctx.usuario!.senha);
});

When('eu faço login com o e-mail do cliente e a senha {string}', async ({ loginPage, ctx }, senha: string) => {
  await loginPage.login(ctx.usuario!.email, senha);
});

When('eu faço login com um e-mail não cadastrado', async ({ loginPage }) => {
  await loginPage.login(`nao.cadastrado.${Date.now()}@example.com`, 'Qualquer#Senha1');
});

When('eu faço login com o e-mail {string} e a senha {string}', async ({ loginPage }, email: string, senha: string) => {
  await loginPage.login(email, senha);
});

When(
  'eu erro a senha do cliente {int} vezes seguidas',
  async ({ loginPage, ctx }, tentativas: number) => {
    // Cada tentativa aguarda a resposta da API para garantir que todas sejam contabilizadas.
    for (let i = 1; i <= tentativas; i++) {
      const status = await loginPage.loginAndWaitForApi(ctx.usuario!.email, `SenhaErrada#${i}`);
      expect(status, `tentativa ${i}`).toBe(401);
    }
  },
);

Then('devo ser redirecionado para a página {string}', async ({ page, loginPage }, titulo: string) => {
  await expect(page).toHaveURL(/\/account$/);
  await expect(loginPage.pageTitle).toHaveText(titulo);
});

Then('devo ver o nome do cliente no menu de navegação', async ({ header, ctx }) => {
  await expect(header.userMenu).toContainText(`${ctx.usuario!.nome} ${ctx.usuario!.sobrenome}`);
  await expect(header.signInLink).toBeHidden();
});

Then('devo ver a mensagem de erro de login {string}', async ({ loginPage }, mensagem: string) => {
  await expect(loginPage.loginError).toHaveText(mensagem);
});

Then('devo permanecer na página de login sem estar autenticado', async ({ page, loginPage, header }) => {
  await expect(page).toHaveURL(new RegExp(`${loginPage.path}$`));
  await expect(header.signInLink).toBeVisible();
  await expect(header.userMenu).toBeHidden();
});

Then(
  'o campo {string} do login deve exibir o erro {string}',
  async ({ loginPage }, campo: string, mensagem: string) => {
    const field = campo === 'e-mail' ? 'email' : 'password';
    await expect(loginPage.fieldError(field)).toHaveText(mensagem);
  },
);
