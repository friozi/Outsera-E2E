import type { ChainablePromiseElement } from 'webdriverio';
import { byTestId, byText } from '../support/selectors';

export abstract class BaseScreen {
  protected el(testId: string): ChainablePromiseElement {
    return $(byTestId(testId));
  }

  /** Para testIDs repetidos (ex.: um por item de lista). */
  protected all(testId: string) {
    return $$(byTestId(testId));
  }

  /**
   * No iOS o React Native expõe o mesmo texto em dois StaticText aninhados (contêiner e filho),
   * então a busca por texto não é estrita: qualquer ocorrência representa o mesmo conteúdo.
   */
  textElement(text: string): ChainablePromiseElement {
    return $(byText(text), { strict: false });
  }

  get headerTitle(): ChainablePromiseElement {
    return this.el('header-title');
  }

  protected async type(testId: string, value: string): Promise<void> {
    const field = this.el(testId);
    await field.waitForDisplayed();
    await field.clearValue();
    if (value) await field.setValue(value);
  }

  protected async hideKeyboard(): Promise<void> {
    // No iOS o teclado deste app não tem tecla de fechar ("Done"); quem o tira da frente é o swipe.
    if (driver.isAndroid && (await driver.isKeyboardShown())) {
      await driver.hideKeyboard();
    }
  }

  /** Rola a tela (swipe para cima) até o elemento ficar visível. */
  protected async scrollUntilDisplayed(element: ChainablePromiseElement, maxSwipes = 4): Promise<void> {
    for (let i = 0; i < maxSwipes && !(await element.isDisplayed()); i++) {
      await this.swipeUp();
    }
    await element.waitForDisplayed({ timeout: 5_000 });
  }

  private async swipeUp(): Promise<void> {
    const { width, height } = await driver.getWindowSize();
    if (driver.isAndroid) {
      await driver.execute('mobile: swipeGesture', {
        left: width * 0.1, top: height * 0.3, width: width * 0.8, height: height * 0.5,
        direction: 'up', percent: 0.6,
      });
      return;
    }
    // iOS: gesto W3C puro (tocar, arrastar, soltar). O "mobile: swipe" consulta a árvore de
    // acessibilidade do app inteiro e, com o PickerWheel na tela, isso derrubava o app (OBS-05).
    // O gesto começa na parte superior do formulário, longe da roleta de assunto.
    const x = Math.round(width / 2);
    await driver
      .action('pointer', { parameters: { pointerType: 'touch' } })
      .move({ x, y: Math.round(height * 0.4) })
      .down()
      .pause(100)
      .move({ duration: 400, x, y: Math.round(height * 0.15) })
      .up()
      .perform();
  }
}
