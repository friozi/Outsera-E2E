# Testes E2E: Toolshop (Practice Software Testing)

Testes automatizados de ponta a ponta escritos em **BDD com Gherkin em português**, usando **Playwright** e **playwright-bdd**. A aplicação testada é a [Practice Software Testing / Toolshop](https://practicesoftwaretesting.com), um e-commerce de ferramentas mantido pela Testsmith para prática de testes.

| Tarefa | Feature | O que cobre |
|---|---|---|
| 1: Login e navegação | [`features/login.feature`](features/login.feature) | Login válido, navegação até o formulário de contato, envio do formulário, senha incorreta, usuário inexistente, campos obrigatórios em branco, formato inválido e bloqueio de conta |
| 2: Checkout | [`features/checkout.feature`](features/checkout.feature) | Carrinho e cálculo do total, endereço de cobrança, pagamento (cartão, transferência e pagamento na entrega), confirmação do pedido, cartão inválido, endereço incompleto e cenários que expõem defeitos |

---

## Como executar

Pré-requisito: **Node.js 18 ou superior**.

```bash
npm install
npx playwright install chromium
npm test                  # suíte completa (gera os relatórios em reports/)
```

| Comando | Descrição |
|---|---|
| `npm test` | Executa todos os cenários |
| `npm run test:login` | Só a Tarefa 1 (`@login`) |
| `npm run test:checkout` | Só a Tarefa 2 (`@checkout`) |
| `npm run test:smoke` | Só os fluxos críticos (`@smoke`) |
| `npm run test:headed` | Mostra o navegador durante a execução |
| `npm run allure:open` | Abre o relatório **Allure** (gerado ao final de cada `npm test`) |
| `npm run report` | Abre o relatório HTML do Playwright |
| `ALL_BROWSERS=true npm test` | Executa em Chromium, Firefox e WebKit |
| `npx bddgen && npx playwright test --grep "@negativo"` | Filtra por qualquer tag |

### Ambiente

A suíte usa a aplicação **hospedada** por padrão. Para usar a versão local (Docker, do repositório [`practice-software-testing`](../practice-software-testing)), copie `.env.example` para `.env` e ajuste:

```bash
BASE_URL=http://localhost:4200
API_URL=http://localhost:8091
```

---

## Estrutura

```
features/                    # Especificações em Gherkin (pt)
  login.feature
  checkout.feature
src/
  pages/                     # Page Objects: um por página ou etapa do checkout
    BasePage.ts
    HeaderComponent.ts         (componente compartilhado: menu)
    LoginPage.ts / ContactPage.ts
    ProductCatalogPage.ts / ProductDetailPage.ts / CartPage.ts
    CheckoutSignInStep.ts / CheckoutAddressStep.ts / CheckoutPaymentStep.ts
  steps/                     # Step definitions (só orquestram Page Objects e fazem as validações)
  fixtures/index.ts          # Injeção dos Page Objects, contexto do cenário, hook de evidências
  support/api-client.ts      # Preparação de massa de dados pela API
  data/test-data.ts          # Dados de teste e mensagens esperadas
playwright.config.ts         # Configuração do runner, dos relatórios e das evidências
```

O pipeline de CI fica na raiz do repositório, em [`.github/workflows/e2e-web.yml`](../.github/workflows/e2e-web.yml). Ele executa a suíte e publica os relatórios como artefato.

### Boas práticas aplicadas

- **Page Object Pattern.** Os seletores e as interações ficam só nas páginas. Os steps não usam seletores diretamente.
- **Fixtures do Playwright** para injetar os Page Objects nos steps, sem `new` espalhado pelo código e sem estado global.
- **Seletores estáveis.** Os testes usam o atributo `data-test` (configurado em `testIdAttribute`) e roles acessíveis. Não há XPath nem classes de CSS de layout.
- **Sem esperas fixas.** Nenhum `waitForTimeout`. Toda espera é por estado: asserções com auto-retry, `expect.poll` e monitoramento de rede.
- **Massa de dados isolada.** Cada cenário cria o próprio cliente pela API (veja abaixo).
- **Steps declarativos.** O Gherkin descreve o comportamento ("preencho o endereço com dados válidos") e não os cliques.
- **Esquemas de Cenário** com tabelas de exemplos para cobrir variações negativas sem duplicar código.
- **Tags** para executar partes da suíte: `@login`, `@checkout`, `@positivo`, `@negativo`, `@smoke` e `@seguranca`. Os cenários que expõem defeitos têm `@bug-01`, `@bug-02` e `@bug-03`.

---

## Estabilidade: problemas encontrados e como foram tratados

A aplicação pública é **compartilhada com qualquer pessoa na internet**. Antes de chegar ao resultado final (execuções seguidas com resultado idêntico, **sem retry**: 25 passam e 3 falham, sempre os mesmos, por causa dos defeitos da aplicação), surgiram as fontes de instabilidade abaixo:

| Problema | Solução |
|---|---|
| A API **bloqueia a conta após 3 senhas erradas**. Com os usuários padrão (`customer@...`), qualquer pessoa pode bloquear a conta e quebrar a suíte. | Cada cenário cria um **cliente novo pela API** ([`api-client.ts`](src/support/api-client.ts)). A validação continua sendo feita pela interface. |
| O **estoque é consumido** pelas compras de todos os usuários. Um produto fixo no teste ficou sem estoque durante o desenvolvimento. | O produto é **escolhido pela API entre os que têm estoque**. O nome escolhido aparece como anotação no relatório. |
| Produto com **limite de 1 unidade por cliente** ("Thor Hammer"). A regra só aparece na descrição do produto. | Esses produtos ficam numa lista de exclusão documentada (`PRODUTOS_COM_LIMITE_POR_CLIENTE`). |
| O endereço é **preenchido automaticamente** (perfil + consulta de CEP com *debounce* de 300 ms) e sobrescrevia valores já digitados. | [`CheckoutAddressStep`](src/pages/CheckoutAddressStep.ts) monitora as requisições `/postcode-lookup` e só escreve nos campos depois que o formulário estabiliza. |
| O backend **recusa o pedido se a cidade não corresponde ao CEP**. | O fluxo positivo aceita o preenchimento automático, como um cliente real faria. A recusa virou um cenário negativo (BUG-03). |
| O cadastro de usuário é **lento (4 a 7 s)** e às vezes retorna **500** ou estoura o tempo quando há execuções paralelas. | Só no *setup*: timeout próprio de 30 s e nova tentativa em caso de 5xx ou timeout (erros 4xx e asserções nunca são repetidos). O cliente só é criado nos cenários que precisam dele. |
| A busca da loja **não encontra produtos pelo nome completo** (ex.: "Claw Hammer with Shock Reduction Grip" retorna 0 resultados). | O produto é aberto pelo card do catálogo. Observação registrada para investigação. |

O `retries: 1` (2 no CI) fica só como proteção contra a rede. Um teste que passa apenas no retry aparece como **flaky** no relatório, então o problema não fica escondido.

---

## Relatórios e evidências

O relatório Allure da última execução na `main` fica publicado em **https://friozi.github.io/Outsera-E2E/web/**.

Cada execução gera:

| Relatório | Caminho | Conteúdo |
|---|---|---|
| **Allure** | `reports/allure-report/` (`npm run allure:open`) | Painel com gráficos, histórico de retentativas e cada passo Gherkin com o **screenshot** dele. Organização por épico > funcionalidade > cenário, severidade (`@smoke` e `@seguranca` = crítico), categorias (*defeitos da aplicação* × *problemas de teste/ambiente*), ambiente da execução e link para o defeito nos cenários `@bug-NN` |
| **Cucumber HTML** | `reports/cucumber/index.html` | Arquivo único com cada cenário em Gherkin e **um screenshot por passo** |
| **Playwright HTML** | `reports/playwright/` (`npm run report`) | Passos, screenshots, **vídeo e trace** (linha do tempo navegável com DOM, rede e console) das falhas |
| Cucumber JSON / JUnit | `reports/cucumber/report.json`, `junit.xml` | Para integrar com CI, Xray, Allure etc. |

**Evidências dos cenários negativos.** O hook `AfterStep` ([`fixtures/index.ts`](src/fixtures/index.ts)) anexa um screenshot ao fim de cada passo. Assim, as mensagens de erro esperadas ("Invalid email or password", "Invalid card number format." etc.) ficam registradas visualmente no relatório, além de validadas pelas asserções.

**Cenários que falham por defeito da aplicação.** Três cenários descrevem o **comportamento correto esperado** e falham porque a aplicação tem defeitos (veja a próxima seção). A falha é intencional: a suíte fica vermelha enquanto o defeito existir. O relatório traz screenshot, vídeo e trace de cada falha como evidência, e quando o defeito for corrigido o cenário passa sem nenhuma alteração no código.

---

## Defeitos encontrados

| ID | Severidade | Descrição | Cenário |
|---|---|---|---|
| **BUG-01** | Média | Titular do cartão com números ("Ana 123") desabilita o botão de pagamento, mas a mensagem de erro aparece **vazia**. O template só mostra o texto para o erro `required`, e o campo valida apenas `pattern`. | *Titular do cartão com números deve informar o motivo da recusa* |
| **BUG-02** | Baixa | Campo obrigatório do endereço em branco bloqueia o avanço, mas **não recebe destaque visual** (`is-invalid`). O cliente não sabe o que falta. | *Campo obrigatório do endereço em branco deve ser destacado para o cliente* |
| **BUG-03** | Alta | Quando o backend recusa o pedido (HTTP 422: cidade não corresponde ao CEP), a tela **ignora o erro**. O botão "Confirm" não faz nada e nenhuma mensagem aparece (o código-fonte tem `error: () => { // handle error if needed }`). | *Pedido com cidade divergente do CEP deve informar a recusa ao cliente* |

Observações que não viraram defeito formal:

- O número do cartão é validado só pelo formato (`0000-0000-0000-0000`), sem dígito verificador (Luhn). Por isso os cenários de "cartão inválido" cobrem formato, validade e CVV.
- A busca pelo nome completo de um produto retorna 0 resultados (precisa de investigação).

---

## Cobertura

**Tarefa 1: login e navegação (12 cenários)**

| Tipo | Cenário |
|---|---|
| ✅ Positivo | Login válido, com redirecionamento para "My account" e nome do cliente no menu |
| ✅ Positivo | Navegação até o formulário de contato (URL, título, campos e saudação personalizada) |
| ✅ Positivo | Envio de mensagem pelo formulário de contato |
| ❌ Negativo | Senha incorreta |
| ❌ Negativo | Usuário inexistente |
| ❌ Negativo | Todos os campos em branco |
| ❌ Negativo | E-mail em branco, senha em branco, e-mail sem domínio, senha curta (esquema de cenário) |
| ❌ Negativo | Formulário de contato sem os campos obrigatórios |
| 🔒 Segurança | Conta bloqueada após 3 tentativas com senha errada |

**Tarefa 2: checkout (16 cenários)**

| Tipo | Cenário |
|---|---|
| ✅ Positivo | Compra completa com cartão de crédito (quantidade, total = preço × quantidade, endereço, pagamento aprovado e número da fatura) |
| ✅ Positivo | Compra completa com transferência bancária e com pagamento na entrega |
| ❌ Negativo | Cartão: número incompleto, com letras, sem separadores, vencido, mês inválido, CVV com 2 dígitos |
| ❌ Negativo | Endereço incompleto: rua, cidade, estado ou CEP em branco |
| 🐛 Falha (defeito da aplicação) | BUG-01, BUG-02 e BUG-03 |

Os negativos não validam só a mensagem. Também verificam que o fluxo **não avança**: o botão fica desabilitado, a etapa seguinte não aparece e o usuário continua sem autenticação.
