import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import allure from 'allure-commandline';
import allureReporter from '@wdio/allure-reporter';

const ROOT = path.resolve(__dirname, '..');

export const APPS_DIR = path.join(ROOT, 'apps');
export const ALLURE_RESULTS = path.join(ROOT, 'allure-results');
export const ALLURE_REPORT = path.join(ROOT, 'allure-report');

/**
 * Configuração comum a todas as execuções (local ou BrowserStack). Os arquivos de cada plataforma
 * acrescentam capabilities, o destino da sessão e hooks próprios por meio de `combine()`.
 */
export const sharedConfig: WebdriverIO.Config = {
  runner: 'local',
  specs: [path.join(ROOT, 'test/specs/**/*.spec.ts')],
  maxInstances: 1,
  capabilities: [],
  logLevel: 'warn',
  outputDir: path.join(ROOT, 'logs'),
  bail: 0,
  waitforTimeout: 20_000,
  connectionRetryTimeout: 600_000,
  connectionRetryCount: 1,

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 240_000,
    // Os apps dependem de um ambiente público compartilhado (API v4), sujeito a instabilidades
    // momentâneas. Uma nova tentativa absorve isso sem esconder o problema: no Allure, o teste que
    // só passa na repetição aparece com o histórico de tentativas. Defeitos reais falham nas duas.
    retries: 1,
  },

  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: ALLURE_RESULTS,
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
        disableMochaHooks: true,
        addConsoleLogs: true,
      },
    ],
  ],

  onPrepare() {
    // Execução combinada (npm test) acumula Android + iOS no mesmo relatório.
    if (process.env.ALLURE_APPEND !== 'true') {
      fs.rmSync(ALLURE_RESULTS, { recursive: true, force: true });
    }
    fs.mkdirSync(ALLURE_RESULTS, { recursive: true });
  },

  async afterTest(test, _context, { passed }) {
    // Evidência final de todos os testes (sucesso ou falha). A captura é anexada ao Allure automaticamente.
    // A coleta de evidência nunca deve mascarar o erro original do teste (ex.: se o app caiu).
    try {
      await browser.takeScreenshot();
      if (!passed) {
        allureReporter.addAttachment('page-source.xml', await browser.getPageSource(), 'application/xml');
      }
    } catch (erro) {
      console.warn(`Não foi possível coletar evidências de "${test.title}": ${(erro as Error).message}`);
    }
  },

  onComplete() {
    writeAllureEnvironment();
    return generateAllureReport();
  },
};

type HookName = 'onPrepare' | 'onComplete' | 'before' | 'afterTest' | 'after';

/**
 * Junta configurações parciais. Hooks com o mesmo nome são encadeados (o WebdriverIO aceita
 * arrays de hooks), em vez de um sobrescrever o outro como aconteceria com o spread.
 */
export function combine(...parts: Partial<WebdriverIO.Config>[]): WebdriverIO.Config {
  const hooks: HookName[] = ['onPrepare', 'onComplete', 'before', 'afterTest', 'after'];
  const result = Object.assign({}, ...parts) as WebdriverIO.Config;
  for (const hook of hooks) {
    const chain = parts.flatMap((p) => (p[hook] ? [p[hook]].flat() : []));
    if (chain.length) (result as unknown as Record<string, unknown>)[hook] = chain;
  }
  return result;
}

/**
 * Registra o ambiente da plataforma para a página inicial do Allure. Cada execução grava o seu
 * arquivo; o onComplete junta tudo em environment.properties (Android + iOS no mesmo relatório).
 */
export function reportEnvironment(environment: Record<string, string>): Partial<WebdriverIO.Config> {
  return {
    onPrepare() {
      fs.writeFileSync(path.join(ALLURE_RESULTS, `env-${environment.Plataforma}.json`), JSON.stringify(environment));
    },
  };
}

export function writeAllureEnvironment(): void {
  const entries: Record<string, string> = {
    API: process.env.API_URL ?? 'https://api-v4.practicesoftwaretesting.com',
    'Node.js': process.version,
  };
  for (const file of fs.readdirSync(ALLURE_RESULTS).filter((f) => /^env-.+\.json$/.test(f))) {
    const env: Record<string, string> = JSON.parse(fs.readFileSync(path.join(ALLURE_RESULTS, file), 'utf8'));
    for (const [key, value] of Object.entries(env)) {
      if (key !== 'Plataforma') entries[`${env.Plataforma} - ${key}`] = value;
    }
  }
  const content = Object.entries(entries).map(([k, v]) => `${k.replace(/ /g, '\\ ')}=${v}`).join('\n');
  fs.writeFileSync(path.join(ALLURE_RESULTS, 'environment.properties'), content);
}

export function generateAllureReport(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const generation = allure(['generate', ALLURE_RESULTS, '--clean', '-o', ALLURE_REPORT]);
    const timeout = setTimeout(() => reject(new Error('Timeout ao gerar o relatório Allure')), 60_000);
    generation.on('exit', (code: number) => {
      clearTimeout(timeout);
      if (code !== 0) return reject(new Error(`Falha ao gerar o relatório Allure (código ${code})`));
      console.log(`\nRelatório Allure gerado em ${ALLURE_REPORT}`);
      resolve();
    });
  });
}
