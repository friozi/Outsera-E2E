import { expect } from '@playwright/test';
import { Given, Then, When } from '../fixtures';
import { CARTAO_VALIDO, CartaoDeCredito, Endereco, ENDERECO_VALIDO, MENSAGENS } from '../data/test-data';
import { AddressField, CartPage, CheckoutAddressStep, CheckoutSignInStep, PaymentMethod } from '../pages';

const CAMPOS_ENDERECO: Record<string, keyof Endereco> = {
  rua: 'rua',
  cidade: 'cidade',
  estado: 'estado',
  CEP: 'cep',
  número: 'numero',
};

const CAMPO_TELA: Record<keyof Endereco, AddressField> = {
  pais: 'country',
  cep: 'postal_code',
  numero: 'house_number',
  rua: 'street',
  cidade: 'city',
  estado: 'state',
};

// ---------- Carrinho ----------

Given(
  'que adicionei {int} unidade(s) de um produto em estoque ao carrinho',
  async ({ api, catalogPage, productPage, header, ctx, $testInfo }, quantidade: number) => {
    ctx.produto = await api.buscarProdutoEmEstoque();
    $testInfo.annotations.push({ type: 'Produto', description: ctx.produto.nome });

    await catalogPage.open();
    await catalogPage.openProduct(ctx.produto.nome);
    await expect(productPage.productName).toHaveText(ctx.produto.nome);

    ctx.precoUnitario = await productPage.getUnitPrice();
    ctx.quantidade = quantidade;
    await productPage.addToCart(quantidade);

    await expect(header.cartQuantity).toHaveText(String(quantidade));
  },
);

When('eu acesso o carrinho', async ({ header, cartPage }) => {
  await header.goToCart();
  await expect(cartPage.rows.first()).toBeVisible();
});

Then('o carrinho deve conter {int} unidade(s) do produto escolhido', async ({ cartPage, ctx }, quantidade: number) => {
  const produto = ctx.produto!.nome;
  await expect(cartPage.row(produto)).toHaveCount(1);
  await expect(cartPage.quantityOf(produto)).toHaveValue(String(quantidade));
});

Then('o total do carrinho deve ser o preço unitário multiplicado pela quantidade', async ({ cartPage, ctx }) => {
  const esperado = Number((ctx.precoUnitario! * ctx.quantidade!).toFixed(2));
  await expect.poll(() => cartPage.getTotal(), { message: 'total do carrinho' }).toBe(esperado);
});

// ---------- Navegação entre etapas ----------

/** Carrinho -> identificação -> endereço, aguardando o preenchimento automático do endereço do perfil. */
async function avancarAteEndereco(
  cartPage: CartPage,
  signInStep: CheckoutSignInStep,
  addressStep: CheckoutAddressStep,
): Promise<void> {
  await cartPage.proceed();
  // O endereço do perfil é carregado ao entrar na etapa e dispara a consulta de CEP.
  const lookupSettled = addressStep.trackPostcodeLookups();
  await signInStep.proceed();
  await lookupSettled();
}

When('eu avanço para o endereço de cobrança', async ({ cartPage, signInStep, addressStep }) => {
  await avancarAteEndereco(cartPage, signInStep, addressStep);
});

Given(
  'que estou na etapa de endereço de cobrança do checkout',
  async ({ header, cartPage, signInStep, addressStep }) => {
    await header.goToCart();
    await avancarAteEndereco(cartPage, signInStep, addressStep);
  },
);

Given(
  'que estou na etapa de pagamento do checkout',
  async ({ header, cartPage, signInStep, addressStep, paymentStep }) => {
    await header.goToCart();
    await avancarAteEndereco(cartPage, signInStep, addressStep);
    await addressStep.fill(ENDERECO_VALIDO);
    await addressStep.proceed();
    await expect(paymentStep.paymentMethodSelect).toBeVisible();
  },
);

// ---------- Endereço ----------

When('eu preencho o endereço de cobrança com dados válidos', async ({ addressStep }) => {
  await addressStep.fill(ENDERECO_VALIDO);
});

When('eu informo a cidade {string} que não pertence ao CEP', async ({ addressStep }, cidade: string) => {
  await addressStep.fill({ ...ENDERECO_VALIDO, cidade });
});

When('eu avanço para o pagamento', async ({ addressStep, paymentStep }) => {
  await expect(addressStep.proceedButton).toBeEnabled();
  await addressStep.proceed();
  await expect(paymentStep.paymentMethodSelect).toBeVisible();
});

When(
  'eu preencho o endereço de cobrança deixando o campo {string} em branco',
  async ({ addressStep }, campo: string) => {
    const chave = CAMPOS_ENDERECO[campo];
    expect(chave, `campo de endereço desconhecido: ${campo}`).toBeDefined();
    await addressStep.fill({ ...ENDERECO_VALIDO, [chave]: '' });
  },
);

Then('o campo {string} do endereço deve ficar inválido', async ({ addressStep }, campo: string) => {
  const field = addressStep.field(CAMPO_TELA[CAMPOS_ENDERECO[campo]]);
  await expect(field).toHaveValue('');
  await expect(field).toHaveClass(/ng-invalid/);
});

Then('o campo {string} do endereço deve ser destacado visualmente', async ({ addressStep }, campo: string) => {
  await expect(addressStep.field(CAMPO_TELA[CAMPOS_ENDERECO[campo]])).toHaveClass(/is-invalid/);
});

Then('não devo conseguir avançar para o pagamento', async ({ addressStep, paymentStep }) => {
  await expect(addressStep.proceedButton).toBeDisabled();
  await expect(paymentStep.paymentMethodSelect).toBeHidden();
});

// ---------- Pagamento ----------

When('eu escolho pagar com cartão de crédito usando dados válidos', async ({ paymentStep }) => {
  await paymentStep.selectMethod('Credit Card');
  await paymentStep.fillCreditCard(CARTAO_VALIDO);
});

When('eu escolho pagar com {string}', async ({ paymentStep }, metodo: PaymentMethod) => {
  await paymentStep.selectMethod(metodo);
  if (metodo === 'Bank Transfer') {
    await paymentStep.fillBankTransfer('Banco Teste', 'Ana Teste', '123456789');
  }
});

When(
  'eu preencho o cartão com número {string}, validade {string}, CVV {string} e titular {string}',
  async ({ paymentStep }, numero: string, validade: string, cvv: string, titular: string) => {
    const cartao: CartaoDeCredito = { numero, validade, cvv, titular };
    await paymentStep.selectMethod('Credit Card');
    await paymentStep.fillCreditCard(cartao);
  },
);

When('eu solicito a verificação do pagamento', async ({ paymentStep }) => {
  await expect(paymentStep.finishButton).toBeEnabled();
  await paymentStep.checkPayment();
});

Then('devo ver a mensagem de pagamento aprovado', async ({ paymentStep }) => {
  await expect(paymentStep.successMessage).toHaveText(MENSAGENS.pagamentoAprovado);
});

When('eu confirmo o pedido', async ({ paymentStep }) => {
  await paymentStep.confirmOrder();
});

Then('devo ver a confirmação do pedido com o número da fatura', async ({ paymentStep, $testInfo }) => {
  await expect(paymentStep.orderConfirmation).toHaveText(MENSAGENS.pedidoConfirmado);
  const texto = await paymentStep.orderConfirmation.innerText();
  const fatura = texto.match(MENSAGENS.pedidoConfirmado)![1];
  $testInfo.annotations.push({ type: 'Fatura gerada', description: fatura });
});

Then('devo ser informado de que o pedido não foi concluído', async ({ paymentStep }) => {
  await expect(paymentStep.errorMessage).toBeVisible();
  await expect(paymentStep.orderConfirmation).toBeHidden();
});

Then('o pagamento deve exibir o erro {string}', async ({ paymentStep }, mensagem: string) => {
  await expect(paymentStep.validationErrors.filter({ hasText: mensagem })).toBeVisible();
});

Then('não devo conseguir verificar o pagamento', async ({ paymentStep }) => {
  await expect(paymentStep.finishButton).toBeDisabled();
  await expect(paymentStep.successMessage).toBeHidden();
});
