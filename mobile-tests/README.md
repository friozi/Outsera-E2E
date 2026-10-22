# Testes mobile: app Toolshop (Android e iOS)

Testes automatizados do app mobile do [Practice Software Testing](https://github.com/testsmith-io/practice-software-testing) (React Native, integrado à API v4), executados em **Android e iOS** com a mesma suíte.

| | |
|---|---|
| Automação | **Appium 3** (UiAutomator2 no Android, XCUITest no iOS) |
| Cliente e runner | **WebdriverIO 10** + **Mocha**, em TypeScript |
| Organização | **Page Object Model** (uma classe por tela) |
| Relatório | **Allure**, com passos, screenshot por passo e ambiente das duas plataformas |

| Tarefa | Spec | O que cobre |
|---|---|---|
| 1: login, navegação e validação de elementos | [`test/specs/login.spec.ts`](test/specs/login.spec.ts) | Login válido com saudação no menu; catálogo → quantidade → carrinho, com validação de produto, quantidade, totais e botão de checkout; login em branco, e-mail inválido, senha incorreta e usuário inexistente |
| 2: formulário | [`test/specs/contact.spec.ts`](test/specs/contact.spec.ts) | Elementos do formulário; envio com dados válidos, incluindo o seletor nativo de assunto e a confirmação; formulário em branco; e-mail inválido (expõe um defeito) |

---

## Resultado

| Plataforma | Dispositivo | Passaram | Falharam |
|---|---|---|---|
| Android | Emulador Pixel 9, Android 16 | 9 | 1 (BUG-M01) |
| iOS | Simulador iPhone 16 Pro, iOS 18.6 | 9 | 1 (BUG-M01) |

A única falha é **intencional**: o teste descreve o comportamento correto e falha porque o app tem um defeito (veja [Defeitos e observações](#defeitos-e-observações)).

---

## Configuração do ambiente

### Pré-requisitos

| Plataforma | Requisitos |
|---|---|
| Ambas | Node.js 18 ou superior |
| Android | Android SDK (Android Studio), um emulador (AVD) e JDK 17 ou superior. Variáveis `ANDROID_HOME` e `JAVA_HOME` definidas |
| iOS (só macOS) | Xcode com um simulador de iPhone |

O Appium e os drivers ficam **instalados no projeto** (pasta `.appium`), sem instalação global. Assim a versão usada fica registrada e é a mesma em qualquer máquina.

### Instalação

```bash
npm install
npm run appium:drivers     # instala UiAutomator2 e XCUITest
npm run apps:download      # baixa o APK e o build de simulador iOS oficiais
npm run appium:doctor      # (opcional) diagnóstico do ambiente
```

### Execução

Com um emulador Android ligado e/ou o simulador iOS disponível:

| Comando | Descrição |
|---|---|
| `npm test` | Android + iOS, gerando **um único relatório** com as duas plataformas |
| `npm run test:android` | Somente Android |
| `npm run test:ios` | Somente iOS. A primeira execução compila o WebDriverAgent (alguns minutos) |
| `npm run report` | Abre o relatório Allure no navegador |
| `npx wdio run config/wdio.android.conf.ts --spec test/specs/contact.spec.ts` | Um arquivo de teste específico |

Variáveis opcionais:

| Variável | Uso |
|---|---|
| `ANDROID_AVD` | Nome do AVD, para o Appium ligar o emulador sozinho |
| `ANDROID_DEVICE` | Nome ou serial do dispositivo |
| `IOS_DEVICE` | Simulador. Padrão: `iPhone 16 Pro` |
| `IOS_VERSION` | Versão do iOS. Padrão: `18.6` |
| `API_URL` | URL da API usada no setup |

---

## Estrutura

```
config/
  wdio.shared.conf.ts     # runner, Mocha, Allure, ciclo de vida do Appium, evidências
  wdio.android.conf.ts    # capabilities Android (UiAutomator2) + porta 4723
  wdio.ios.conf.ts        # capabilities iOS (XCUITest) + porta 4724
src/
  pages/                  # Page Objects: um por tela, sem asserções
    BaseScreen.ts           (helpers comuns: digitação, teclado, rolagem)
    ProductsScreen.ts / DrawerMenu.ts / LoginScreen.ts / CartScreen.ts / ContactScreen.ts
  support/
    selectors.ts          # estratégia de locators nativos por plataforma
    app.ts                # reinício do app com dados limpos entre os testes
    api.ts                # criação de usuário via API (massa de dados)
    report.ts             # passos do Allure com screenshot e classificação dos testes
  data/test-data.ts       # dados e mensagens esperadas
test/specs/               # testes (Mocha): só orquestram Page Objects e fazem as validações
scripts/                  # download dos apps e execução combinada
```

---

## Locators nativos

O app define um `testID` em cada elemento, e cada plataforma o expõe de um jeito. O tratamento fica centralizado em [`selectors.ts`](src/support/selectors.ts), e os Page Objects usam só o nome do `testID`:

| Plataforma | Onde o `testID` aparece | Estratégia |
|---|---|---|
| Android | `resource-id`, **sem** o prefixo do pacote | `android=new UiSelector().resourceId("login-button")`. O seletor `id=` do Appium adiciona o prefixo e não encontraria o elemento |
| iOS | `accessibilityIdentifier` | `~login-button` (accessibility id) |

Os componentes nativos que mudam entre plataformas também ficam dentro do Page Object. O seletor de assunto do contato, por exemplo, é um **Spinner** no Android (abre uma lista de opções) e um **PickerWheel** no iOS (uma roleta na própria tela). O teste chama apenas `contact.selectSubject('Webmaster')`.

Não há XPath, coordenadas fixas nem esperas fixas (`pause`) na suíte.

---

## Estabilidade

| Situação | Tratamento |
|---|---|
| Estado do app entre testes (login, carrinho) | `restartAppClean()` limpa os dados do app (`mobile: clearApp`) e o reinicia antes de cada teste. Os testes não dependem da ordem de execução |
| Contas compartilhadas do ambiente público podem ser bloqueadas por terceiros, e o ambiente v4 **reinicia o banco periodicamente** (um usuário criado no início da suíte sumiu no meio da execução) | Cada teste que precisa de login cria o próprio cliente **via API**, imediatamente antes de usá-lo. O login é sempre validado pela interface |
| Asserções do tipo "sucesso não exibido" passariam antes de o app reagir | `waitForSubmitResult()` aguarda a resposta da tela (sucesso ou erro) antes das validações |
| iOS: o botão "Send Message" fica abaixo do teclado ou da dobra da tela | Rolagem até o elemento ficar visível. No Android usa `mobile: swipeGesture`; no iOS, um gesto W3C (tocar, arrastar, soltar), porque o `mobile: swipe` consulta a árvore de acessibilidade inteira e disparava o crash OBS-05 |
| iOS: crash do app ao consultar a árvore de acessibilidade com o PickerWheel na tela (OBS-05) | O teste aguarda a roleta estabilizar no valor escolhido e não faz consultas da árvore inteira nessa tela. Depois da correção, 4 execuções seguidas sem crash |
| `testID` repetido por item de lista (os cards de produto) | Acesso explícito por índice. O WebdriverIO 10 recusa seletores ambíguos (*strict selectors*), o que evita interagir com o elemento errado |
| Appium de uma execução anterior ainda segurando a porta | Cada plataforma tem a sua porta. A configuração encerra o Appium do projeto ao final e libera uma porta presa antes de começar |
| Falha na coleta de evidências (ex.: app caiu) | É tratada sem esconder o erro original do teste |

---

## Relatório Allure

`npm test` gera `allure-report/` (abra com `npm run report`). O relatório mostra:

- **Passos** de cada teste, cada um com **screenshot** ao final, como evidência de cada etapa.
- **Screenshot final** de todos os testes e **page source (XML)** da tela nas falhas, para diagnóstico.
- **Duas visões:**
  - *Suites*: Tarefa 1 / Tarefa 2.
  - *Behaviors*: plataforma → funcionalidade → história, com severidade.
- **Ambiente:** API, versão do Appium, dispositivo, driver e app de cada plataforma.
- **Parâmetro "Plataforma"** em cada teste, para que o mesmo teste em Android e iOS apareça como dois resultados distintos.

---

## Defeitos e observações

| ID | Tipo | Descrição | Plataforma |
|---|---|---|---|
| **BUG-M01** | Defeito (coberto por teste que falha) | O formulário de contato **aceita e-mail sem formato válido** ("email-invalido") e mostra "Thanks for your message!". A API v4 também aceita (HTTP 200). A tela de login do mesmo app valida o formato, e a API v5 rejeita o mesmo dado (HTTP 422) | Ambas |
| OBS-01 | Defeito provável | O campo de e-mail **trunca em 30 caracteres**. Um usuário cadastrado com e-mail mais longo não consegue fazer login pelo app ("Invalid email format") | Ambas |
| OBS-02 | Inconsistência | O contato não exige nome e sobrenome (a versão web exige) | Ambas |
| OBS-03 | UX | O login recusado exibe a mensagem técnica "Unauthorized", em vez de uma mensagem para o usuário | Ambas |
| OBS-04 | Acessibilidade | O modal de detalhe do produto expõe **um único elemento de acessibilidade** que agrupa tudo: os botões internos (quantidade, "Add to Cart") ficam inacessíveis ao VoiceOver e à automação. Por isso o teste adiciona o produto ao carrinho pela lista | iOS |
| OBS-05 | Crash | `EXC_BAD_ACCESS` no UIKit (`UITableViewCellAccessibilityElement` → `_reapTentativeViews`) quando a árvore de acessibilidade do formulário de contato é percorrida com o PickerWheel de assunto na tela. Reproduzido duas vezes, com relatórios `.ips` do simulador. É o mesmo tipo de consulta que o VoiceOver faz, então pode afetar usuários reais | iOS |
| OBS-06 | Comportamento | Para usuário autenticado, o menu mostra só a saudação e o Logout: o "Contact" não aparece. Por isso o formulário é testado como visitante | Ambas |
