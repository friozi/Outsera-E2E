import { expect } from '@wdio/globals';
import { CartScreen, LoginScreen, ProductsScreen } from '../../src/pages';
import { restartAppClean } from '../../src/support/app';
import { criarUsuario, Usuario } from '../../src/support/api';
import { classificar, passo } from '../../src/support/report';
import { MENSAGENS } from '../../src/data/test-data';

/**
 * Tarefa 1: login, navegação entre telas e validação de elementos.
 */
describe('Tarefa 1 - Login e navegação', () => {
  const products = new ProductsScreen();
  const login = new LoginScreen();
  const cart = new CartScreen();
  let usuario: Usuario;

  beforeEach(async () => {
    await restartAppClean();
  });

  /**
   * O ambiente público da API v4 reinicia o banco de dados periodicamente, apagando usuários criados.
   * Por isso o cliente é criado dentro de cada teste, imediatamente antes de ser usado.
   */
  async function criarCliente(): Promise<void> {
    usuario = await passo('Criar um cliente novo via API', () => criarUsuario());
  }

  async function abrirTelaDeLogin(): Promise<void> {
    await passo('Abrir o menu e acessar "Sign In"', async () => {
      const menu = await products.openMenu();
      await menu.goToSignIn();
      await login.waitForLoaded();
      await expect(login.headerTitle).toHaveText('Sign In');
    });
  }

  describe('Fluxos positivos', () => {
    it('deve fazer login com credenciais válidas e exibir a saudação no menu', async () => {
      await classificar({ feature: 'Login', story: 'Login com credenciais válidas', severity: 'critical' });
      await criarCliente();
      await abrirTelaDeLogin();

      await passo('Informar e-mail e senha válidos e confirmar', async () => {
        await login.login(usuario.email, usuario.senha);
      });

      await passo('Voltar ao catálogo de produtos autenticado', async () => {
        await products.waitForLoaded();
        await expect(login.loginButton).not.toBeDisplayed();
      });

      await passo('Validar a saudação e o botão de logout no menu', async () => {
        const menu = await products.openMenu();
        await expect(menu.welcomeMessage).toBeDisplayed();
        await expect(menu.welcomeMessage).toHaveText(`Hello, ${usuario.nome}!`);
        await expect(menu.logoutItem).toBeDisplayed();
        await expect(menu.signInItem).not.toBeDisplayed();
      });
    });

    it('deve navegar do catálogo até o carrinho com o total calculado corretamente', async () => {
      await classificar({ feature: 'Navegação', story: 'Catálogo até o carrinho', severity: 'critical' });
      await criarCliente();
      await abrirTelaDeLogin();
      await passo('Fazer login', async () => {
        await login.login(usuario.email, usuario.senha);
        await products.waitForLoaded();
      });

      const nome = await products.productTitle(0);
      const preco = await products.productPrice(0);

      await passo(`Aumentar a quantidade de "${nome}" para 2`, async () => {
        await expect(await products.quantity(0)).toBe('1');
        await products.increaseQuantity(0);
        await expect(await products.quantity(0)).toBe('2');
      });

      await passo('Adicionar ao carrinho e validar o contador', async () => {
        await products.addToCart(0);
        await expect(products.cartBadge).toHaveText('2');
      });

      await passo('Abrir o carrinho', async () => {
        await products.openCart();
        await cart.waitForLoaded();
      });

      await passo('Validar produto, quantidade, totais e botão de checkout', async () => {
        await expect(cart.productName).toHaveText(nome);
        await expect(cart.quantity).toHaveText('2');
        const esperado = Number((preco * 2).toFixed(2));
        await expect(await cart.getItemTotal()).toBe(esperado);
        await expect(await cart.getTotal()).toBe(esperado);
        await expect(cart.proceedButton).toBeDisplayed();
        await expect(cart.proceedButton).toBeEnabled();
      });
    });
  });

  describe('Fluxos negativos', () => {
    it('deve exigir e-mail e senha ao enviar o login em branco', async () => {
      await classificar({ feature: 'Login', story: 'Campos obrigatórios' });
      await abrirTelaDeLogin();

      await passo('Confirmar sem preencher os campos', async () => {
        await login.loginButton.click();
      });

      await passo('Validar as mensagens de campo obrigatório', async () => {
        await expect(login.emailError).toHaveText(MENSAGENS.campoObrigatorio);
        await expect(login.passwordError).toHaveText(MENSAGENS.campoObrigatorio);
        await expect(login.loginButton).toBeDisplayed();
      });
    });

    it('deve rejeitar e-mail com formato inválido', async () => {
      await classificar({ feature: 'Login', story: 'Formato de e-mail' });
      await abrirTelaDeLogin();

      await passo('Informar e-mail sem domínio', async () => {
        await login.login('cliente@', 'Qualquer#123');
      });

      await passo('Validar a mensagem de formato inválido', async () => {
        await expect(login.emailError).toHaveText(MENSAGENS.emailInvalido);
        await expect(login.loginButton).toBeDisplayed();
      });
    });

    it('deve recusar o login com senha incorreta', async () => {
      await classificar({ feature: 'Login', story: 'Senha incorreta', severity: 'critical' });
      await criarCliente();
      await abrirTelaDeLogin();

      await passo('Informar a senha errada', async () => {
        await login.login(usuario.email, 'SenhaErrada#1');
      });

      await passo('Validar o erro e a permanência na tela de login', async () => {
        await expect(login.errorMessage).toHaveText(MENSAGENS.loginRecusado);
        await expect(login.headerTitle).toHaveText('Sign In');
      });
    });

    it('deve recusar o login de usuário inexistente', async () => {
      await classificar({ feature: 'Login', story: 'Usuário inexistente' });
      await abrirTelaDeLogin();

      await passo('Informar um e-mail não cadastrado', async () => {
        await login.login(`naoexiste${Date.now() % 100_000}@ex.com`, 'Qualquer#123');
      });

      await passo('Validar o erro e a permanência na tela de login', async () => {
        await expect(login.errorMessage).toHaveText(MENSAGENS.loginRecusado);
        await expect(login.headerTitle).toHaveText('Sign In');
      });
    });
  });
});
