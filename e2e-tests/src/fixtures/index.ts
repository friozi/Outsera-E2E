import { test as base, createBdd } from 'playwright-bdd';
import {
  CartPage,
  CheckoutAddressStep,
  CheckoutPaymentStep,
  CheckoutSignInStep,
  ContactPage,
  HeaderComponent,
  LoginPage,
  ProductCatalogPage,
  ProductDetailPage,
} from '../pages';
import { ApiClient, Produto, Usuario } from '../support/api-client';

/** Estado compartilhado entre os steps de um mesmo cenário. */
export interface ScenarioContext {
  usuario?: Usuario;
  produto?: Produto;
  precoUnitario?: number;
  quantidade?: number;
}

type Fixtures = {
  api: ApiClient;
  ctx: ScenarioContext;
  header: HeaderComponent;
  loginPage: LoginPage;
  contactPage: ContactPage;
  catalogPage: ProductCatalogPage;
  productPage: ProductDetailPage;
  cartPage: CartPage;
  signInStep: CheckoutSignInStep;
  addressStep: CheckoutAddressStep;
  paymentStep: CheckoutPaymentStep;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new ApiClient(request, process.env.API_URL ?? 'https://api.practicesoftwaretesting.com'));
  },
  ctx: async ({}, use) => {
    await use({});
  },
  header: async ({ page }, use) => use(new HeaderComponent(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  contactPage: async ({ page }, use) => use(new ContactPage(page)),
  catalogPage: async ({ page }, use) => use(new ProductCatalogPage(page)),
  productPage: async ({ page }, use) => use(new ProductDetailPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  signInStep: async ({ page }, use) => use(new CheckoutSignInStep(page)),
  addressStep: async ({ page }, use) => use(new CheckoutAddressStep(page)),
  paymentStep: async ({ page }, use) => use(new CheckoutPaymentStep(page)),
});

export const { Given, When, Then, AfterStep } = createBdd(test);

/**
 * Evidência por passo: anexa um screenshot ao final de cada step do Gherkin.
 * Os anexos aparecem tanto no relatório do Playwright quanto no relatório Cucumber,
 * permitindo acompanhar visualmente cada cenário, inclusive as mensagens de erro
 * esperadas nos fluxos negativos.
 */
AfterStep(async ({ page, $step, $testInfo }) => {
  await $testInfo.attach(`📸 ${$step.title}`, {
    // JPEG mantém o relatório HTML do Cucumber leve o suficiente para ser compartilhado.
    body: await page.screenshot({ fullPage: true, type: 'jpeg', quality: 60 }),
    contentType: 'image/jpeg',
  });
});
