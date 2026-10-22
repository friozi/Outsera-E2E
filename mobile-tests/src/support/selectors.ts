/**
 * Locators nativos multiplataforma.
 *
 * O app (React Native) define um `testID` em cada elemento, mas cada plataforma o expõe de um jeito:
 * - Android: vira o `resource-id` do elemento, porém SEM o prefixo do pacote. Por isso usamos o
 *   UiSelector do UiAutomator (o seletor `id=` do Appium adiciona o prefixo e não encontra nada).
 * - iOS: vira o `accessibilityIdentifier`, localizado com o seletor de acessibilidade (`~`).
 */
export function byTestId(testId: string): string {
  return driver.isAndroid ? `android=new UiSelector().resourceId("${testId}")` : `~${testId}`;
}

/** Elemento de texto com conteúdo exato (para textos que não possuem testID próprio). */
export function byText(text: string): string {
  const escaped = text.replace(/"/g, '\\"');
  return driver.isAndroid
    ? `android=new UiSelector().text("${escaped}")`
    : `-ios predicate string:type == "XCUIElementTypeStaticText" AND label == "${escaped}"`;
}
