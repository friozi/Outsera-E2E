# Outsera: avaliação de automação de testes

[![E2E web](https://github.com/friozi/Outsera-E2E/actions/workflows/e2e-web.yml/badge.svg)](https://github.com/friozi/Outsera-E2E/actions/workflows/e2e-web.yml)
[![Mobile Android](https://github.com/friozi/Outsera-E2E/actions/workflows/mobile-android.yml/badge.svg)](https://github.com/friozi/Outsera-E2E/actions/workflows/mobile-android.yml)
[![Mobile iOS](https://github.com/friozi/Outsera-E2E/actions/workflows/mobile-ios.yml/badge.svg)](https://github.com/friozi/Outsera-E2E/actions/workflows/mobile-ios.yml)

Projetos de automação de testes da avaliação técnica, todos sobre a aplicação de exemplo
[Practice Software Testing (Toolshop)](https://practicesoftwaretesting.com), da Testsmith.

| Projeto | Escopo | Stack |
|---|---|---|
| [`e2e-tests/`](e2e-tests/) | Testes E2E web: login e navegação, checkout | Playwright + playwright-bdd (Gherkin em português), Page Objects, Allure |
| [`mobile-tests/`](mobile-tests/) | Testes mobile em Android e iOS: login e navegação, formulário | Appium + WebdriverIO + Mocha, Page Objects, Allure, BrowserStack |

Cada projeto tem o próprio README com instruções de execução, decisões técnicas, relatórios
e defeitos encontrados na aplicação.

O código da aplicação testada não faz parte deste repositório: os testes usam as versões
hospedadas publicamente e os builds mobile oficiais (baixados por script).

## Relatórios online

Os relatórios Allure da última execução de cada suíte ficam publicados no GitHub Pages:

**https://friozi.github.io/Outsera-E2E/**

| Suíte | Relatório |
|---|---|
| E2E web | https://friozi.github.io/Outsera-E2E/web/ |
| Mobile Android (BrowserStack) | https://friozi.github.io/Outsera-E2E/android/ |
| Mobile iOS (simulador) | https://friozi.github.io/Outsera-E2E/ios/ |

Cada workflow atualiza só a sua pasta do site, pela action
[`publish-allure`](.github/actions/publish-allure/action.yml). Ela preserva o histórico das
execuções anteriores, o que alimenta o gráfico de tendência do Allure, e registra o link da
execução do Actions no relatório.

## Integração contínua (GitHub Actions)

| Workflow | Execução | Relatórios (artefatos, além do GitHub Pages) |
|---|---|---|
| [`e2e-web.yml`](.github/workflows/e2e-web.yml) | Playwright/Chromium no Ubuntu | `relatorios-e2e-web`: Allure, Playwright e Cucumber |
| [`mobile-android.yml`](.github/workflows/mobile-android.yml) | Android em **dispositivo real no BrowserStack** (runner Ubuntu) | `relatorio-allure-android` |
| [`mobile-ios.yml`](.github/workflows/mobile-ios.yml) | iOS em **simulador no runner macOS** | `relatorio-allure-ios` |

Os workflows rodam quando há mudança no projeto correspondente, e também podem ser disparados
manualmente (*Run workflow*). Android e iOS ficam em workflows separados para que cada plataforma
possa ser reexecutada sozinha: o iOS é bem mais lento (compila o WebDriverAgent no macOS). As credenciais do BrowserStack ficam nos *secrets* do repositório.

Os cenários que expõem defeitos da aplicação falham de propósito, então as execuções ficam
vermelhas enquanto esses defeitos existirem. Os detalhes estão no README de cada projeto.
