# Testes mobile: app Toolshop (Android e iOS)

Testes automatizados do app mobile do [Practice Software Testing](https://github.com/testsmith-io/practice-software-testing) (React Native, integrado à API v4), executados em **Android e iOS** com a mesma suíte.

| | |
|---|---|
| Automação | **Appium 3** (UiAutomator2 no Android, XCUITest no iOS) |
| Cliente e runner | **WebdriverIO 10** + **Mocha**, em TypeScript |
| Organização | **Page Object Model** (uma classe por tela) |
| Relatório | **Allure**, com passos, screenshot por passo e ambiente das duas plataformas |
| Execução | Local (emulador/simulador), **BrowserStack App Automate** (Android em dispositivo real) e **GitHub Actions** |

| Tarefa | Spec | O que cobre |
|---|---|---|
| 1: login, navegação e validação de elementos | [`test/specs/login.spec.ts`](test/specs/login.spec.ts) | Login válido com saudação no menu; catálogo → quantidade → carrinho, com validação de produto, quantidade, totais e botão de checkout; login em branco, e-mail inválido, senha incorreta e usuário inexistente |
| 2: formulário | [`test/specs/contact.spec.ts`](test/specs/contact.spec.ts) | Elementos do formulário; envio com dados válidos, incluindo o seletor nativo de assunto e a confirmação; formulário em branco; e-mail inválido (expõe um defeito) |

---

## Resultado

| Plataforma | Dispositivo | Passaram | Falharam |
|---|---|---|---|
| Android (local) | Emulador Pixel 9, Android 16 | 9 | 1 (BUG-M01) |
| Android (BrowserStack) | **Google Pixel 8 real**, Android 14 | 9 | 1 (BUG-M01) |
| iOS (local) | Simulador iPhone 16 Pro, iOS 18.6 | 9 | 1 (BUG-M01) |
| iOS (local) | Simulador iPhone 17 Pro, iOS 26.5 | 9 | 1 (BUG-M01) |

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
| `npm run test:browserstack:android` | Android em dispositivo real no **BrowserStack** (veja abaixo) |
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

### BrowserStack (Android em dispositivo real)

1. Copie `.env.example` para `.env` e preencha `BROWSERSTACK_USERNAME` e `BROWSERSTACK_ACCESS_KEY`. O `.env` está no `.gitignore`.
2. Rode `npm run apps:download` e depois `npm run test:browserstack:android`.

O que a execução faz:
- **Envia o APK** pela API do App Automate e usa a referência `bs://...` retornada. Para reaproveitar um upload, informe `BROWSERSTACK_APP_URL`.
- **Dá nome a cada sessão** pelo arquivo de teste (`login`, `contact`) e marca a sessão como **passed** ou **failed** no painel do BrowserStack.
- **Coloca no Allure um link** para a sessão no BrowserStack, com vídeo, logs do Appium, do dispositivo e de rede, e capturas automáticas.

| Variável | Padrão |
|---|---|
| `BROWSERSTACK_DEVICE` | `Google Pixel 8` |
| `BROWSERSTACK_OS_VERSION` | `14.0` |
| `BROWSERSTACK_APPIUM_VERSION` | `3.5.2`. Precisa ser 3.x: a versão padrão do BrowserStack é a 1.22, sem os comandos `mobile:` usados aqui |
| `BROWSERSTACK_BUILD_NAME` | Data/hora local, ou número da execução no CI |

> **Por que o iOS não roda no BrowserStack?** O build oficial do app iOS é **somente para simulador** (`CFBundleSupportedPlatforms = iPhoneSimulator`, sem perfil de provisionamento). O App Automate roda iOS apenas em aparelhos reais e exige um `.ipa` assinado. Por isso o iOS roda em simulador: localmente ou no runner macOS do GitHub Actions.

> O serviço oficial `@wdio/browserstack-service` ainda não suporta o WebdriverIO 10. Por isso a integração é feita direto pela API REST e pelo hub W3C ([`config/browserstack.ts`](config/browserstack.ts)).

### GitHub Actions

Cada plataforma tem o próprio workflow. Assim uma pode ser reexecutada sem esperar a outra (o iOS é bem mais lento):

| Workflow | Onde roda | Relatório (artefato) |
|---|---|---|
| [`mobile-android.yml`](../.github/workflows/mobile-android.yml) | BrowserStack, dispositivo real (runner Ubuntu). Antes de tudo, verifica se as credenciais existem e diz qual secret está faltando | `relatorio-allure-android` |
| [`mobile-ios.yml`](../.github/workflows/mobile-ios.yml) | Simulador no runner `macos-15`, escolhendo o iPhone e o iOS mais recentes da imagem | `relatorio-allure-ios` |

Em execuções na `main`, cada workflow também publica o relatório no GitHub Pages: [Android](https://friozi.github.io/Outsera-E2E/android/) e [iOS](https://friozi.github.io/Outsera-E2E/ios/).

Para juntar as duas plataformas em um único relatório, rode `npm test` localmente. Em `allure-results/` também dá para juntar os resultados baixados dos dois artefatos e rodar `npm run allure:generate`.

As credenciais do BrowserStack vêm dos *secrets* do repositório, `BROWSERSTACK_USERNAME` e `BROWSERSTACK_ACCESS_KEY` (*Settings → Secrets and variables → Actions*).

---

## Estrutura

```
config/
  wdio.shared.conf.ts     # runner, Mocha, Allure, evidências e combinação de configs/hooks
  local-appium.ts         # ciclo de vida do Appium local (porta própria, encerramento, órfãos)
  browserstack.ts         # integração com o BrowserStack (upload, nome/status da sessão, link no Allure)
  wdio.browserstack.android.conf.ts  # Android em dispositivo real no BrowserStack
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
| Toque ignorado durante a transição de tela (visto no iOS 26, logo após o login) | `openMenu()` confirma que o menu abriu e repete o toque se necessário. A espera é por estado, não por tempo fixo |
| Instabilidade momentânea do ambiente público: o login recusado chegou a mostrar "Login failed" (erro genérico) em vez de "Unauthorized" | 1 nova tentativa por teste (`mochaOpts.retries`), a mesma política do projeto web. No Allure fica o histórico de tentativas, então a instabilidade continua visível |
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
