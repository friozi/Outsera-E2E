import { expect, Locator, Request } from '@playwright/test';
import { BasePage } from './BasePage';
import { Endereco } from '../data/test-data';

export type AddressField = 'country' | 'postal_code' | 'house_number' | 'street' | 'city' | 'state';

/** Tempo sem novas consultas de CEP para considerar o formulário estável (debounce da tela = 300 ms). */
const QUIET_PERIOD_MS = 1_000;

const FIELD_BY_KEY: Record<keyof Endereco, AddressField> = {
  pais: 'country',
  cep: 'postal_code',
  numero: 'house_number',
  rua: 'street',
  cidade: 'city',
  estado: 'state',
};

/**
 * Passo 3 do checkout: endereço de cobrança.
 *
 * Particularidade: ao informar país + CEP + número a aplicação consulta a API de CEP
 * (debounce de 300 ms) e sobrescreve rua, cidade e estado. Para evitar condição de corrida,
 * toda escrita nesses campos acontece somente depois que a consulta termina.
 */
export class CheckoutAddressStep extends BasePage {
  get proceedButton(): Locator {
    return this.byTestId('proceed-3');
  }

  get lookupLoading(): Locator {
    return this.byTestId('postcode-lookup-loading');
  }

  field(name: AddressField): Locator {
    return this.byTestId(name);
  }

  /**
   * Começa a monitorar as consultas de CEP e retorna uma função que aguarda o formulário estabilizar.
   * Deve ser chamado ANTES da ação que pode disparar consultas.
   *
   * Não exigimos que uma consulta aconteça: dependendo do tempo de carregamento, o endereço do perfil
   * pode ter sido aplicado (e consultado) antes mesmo do monitoramento começar. Uma única ação também
   * pode gerar várias consultas em sequência (cada campo tem seu próprio debounce). Por isso o critério
   * é: formulário já pré-preenchido, nenhuma consulta em andamento e nenhuma atividade recente.
   */
  trackPostcodeLookups(): () => Promise<void> {
    const isLookup = (url: string) => url.includes('/postcode-lookup');
    // Set em vez de contador: uma consulta iniciada antes do monitoramento pode terminar depois dele.
    const pending = new Set<Request>();
    let lastActivity = Date.now();

    const onRequest = (r: Request) => {
      if (!isLookup(r.url())) return;
      pending.add(r);
      lastActivity = Date.now();
    };
    const onFinished = (r: Request) => {
      if (!isLookup(r.url())) return;
      pending.delete(r);
      lastActivity = Date.now();
    };
    this.page.on('request', onRequest);
    this.page.on('requestfinished', onFinished);
    this.page.on('requestfailed', onFinished);

    return async () => {
      try {
        await expect(this.field('country'), 'endereço do perfil pré-preenchido').not.toHaveValue('');
        lastActivity = Math.max(lastActivity, Date.now());
        await expect
          .poll(() => pending.size === 0 && Date.now() - lastActivity > QUIET_PERIOD_MS, {
            message: 'consultas de CEP finalizadas',
            timeout: 15_000,
          })
          .toBe(true);
      } finally {
        this.page.off('request', onRequest);
        this.page.off('requestfinished', onFinished);
        this.page.off('requestfailed', onFinished);
      }
      await expect(this.lookupLoading).toBeHidden();
    };
  }

  async fill(endereco: Endereco): Promise<void> {
    if (await this.willTriggerLookup(endereco)) {
      const lookupSettled = this.trackPostcodeLookups();
      await this.field('country').selectOption(endereco.pais);
      await this.field('postal_code').fill(endereco.cep);
      await this.field('house_number').fill(endereco.numero);
      await lookupSettled();
    } else {
      await this.field('postal_code').fill(endereco.cep);
      await this.field('house_number').fill(endereco.numero);
    }

    for (const key of ['rua', 'cidade', 'estado'] as const) {
      if (endereco[key] !== undefined) {
        await this.field(FIELD_BY_KEY[key]).fill(endereco[key]);
        await this.field(FIELD_BY_KEY[key]).blur();
      }
    }

    for (const [key, field] of Object.entries(FIELD_BY_KEY) as [keyof Endereco, AddressField][]) {
      const expected = endereco[key];
      // Campos não informados devem ter sido preenchidos pela consulta de CEP.
      await expect(this.field(field), `campo "${field}" do endereço`).toHaveValue(expected ?? /.+/);
    }
  }

  async proceed(): Promise<void> {
    await this.proceedButton.click();
  }

  private async willTriggerLookup(endereco: Endereco): Promise<boolean> {
    if (!endereco.pais || !endereco.cep || !endereco.numero) return false;
    return (
      (await this.field('country').inputValue()) !== endereco.pais ||
      (await this.field('postal_code').inputValue()) !== endereco.cep ||
      (await this.field('house_number').inputValue()) !== endereco.numero
    );
  }
}
