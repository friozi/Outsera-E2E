import { expect } from '@playwright/test';
import { Given } from '../fixtures';

Given('que existe um cliente cadastrado', async ({ api, ctx }) => {
  ctx.usuario = await api.criarUsuario();
});

Given('que estou autenticado na aplicação', async ({ page, loginPage, ctx }) => {
  const usuario = ctx.usuario!;
  await loginPage.open();
  await loginPage.login(usuario.email, usuario.senha);
  await expect(page).toHaveURL(/\/account$/);
});
