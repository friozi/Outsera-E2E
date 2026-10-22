import { Locator, Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected byTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }

  get pageTitle(): Locator {
    return this.byTestId('page-title');
  }
}
