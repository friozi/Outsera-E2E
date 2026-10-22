# Outsera: avaliação de automação de testes

Projetos de automação de testes da avaliação técnica, todos sobre a aplicação de exemplo
[Practice Software Testing (Toolshop)](https://practicesoftwaretesting.com), da Testsmith.

| Projeto | Escopo | Stack |
|---|---|---|
| [`e2e-tests/`](e2e-tests/) | Testes E2E web: login e navegação, checkout | Playwright + playwright-bdd (Gherkin em português), Page Objects |
| [`mobile-tests/`](mobile-tests/) | Testes mobile em Android e iOS: login e navegação, formulário | Appium + WebdriverIO + Mocha, Page Objects, Allure |

Cada projeto tem o próprio README com instruções de execução, decisões técnicas, relatórios
e defeitos encontrados na aplicação.

O código da aplicação testada não faz parte deste repositório: os testes usam as versões
hospedadas publicamente e os builds mobile oficiais (baixados por script).
