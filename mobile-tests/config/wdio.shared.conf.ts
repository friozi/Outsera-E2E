import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';
import { execFileSync } from 'node:child_process';
import allure from 'allure-commandline';
import allureReporter from '@wdio/allure-reporter';

const ROOT = path.resolve(__dirname, '..');

// Drivers do Appium ficam instalados no projeto (versão reprodutível, sem instalação global).
process.env.APPIUM_HOME ??= path.join(ROOT, '.appium');

export const APPS_DIR = path.join(ROOT, 'apps');
export const ALLURE_RESULTS = path.join(ROOT, 'allure-results');
export const ALLURE_REPORT = path.join(ROOT, 'allure-report');

/** Ambiente da plataforma em execução, definido por platformConfig() e gravado no onPrepare. */
let platformEnvironment: Record<string, string> = {};

/**
 * Partes da configuração que variam por plataforma:
 * - porta do Appium própria, para que execuções em sequência não disputem o mesmo servidor;
 * - informações de ambiente exibidas na página inicial do relatório Allure.
 */
export function platformConfig(options: {
  port: number;
  environment: Record<string, string>;
}): Pick<WebdriverIO.Config, 'port' | 'services' | 'reporters'> {
  platformEnvironment = options.environment;
  return {
    port: options.port,
    services: [
      [
        'appium',
        {
          command: path.join(ROOT, 'node_modules/.bin/appium'),
          args: { port: options.port, logLevel: 'warn' },
          logPath: path.join(ROOT, 'logs'),
        },
      ],
    ],
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
  };
}

function writeAllureEnvironment(): void {
  const entries: Record<string, string> = {
    API: process.env.API_URL ?? 'https://api-v4.practicesoftwaretesting.com',
    Appium: require('appium/package.json').version,
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
  },

  async onPrepare(config) {
    // Execução combinada (npm test) acumula Android + iOS no mesmo relatório.
    if (process.env.ALLURE_APPEND !== 'true') {
      fs.rmSync(ALLURE_RESULTS, { recursive: true, force: true });
    }
    // Roda antes do serviço do Appium: se o servidor de uma execução anterior ainda está encerrando,
    // aguarda a porta ser liberada em vez de falhar com EADDRINUSE.
    await waitForPortToBeFree(config.port ?? 4723);

    // Registra o ambiente desta plataforma; o onComplete junta Android + iOS em environment.properties.
    fs.mkdirSync(ALLURE_RESULTS, { recursive: true });
    fs.writeFileSync(
      path.join(ALLURE_RESULTS, `env-${platformEnvironment.Plataforma}.json`),
      JSON.stringify(platformEnvironment),
    );
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

  async onComplete(_exitCode, config) {
    // O serviço do Appium nem sempre consegue encerrar o servidor antes de o WDIO sair, deixando-o
    // órfão na porta. Encerramos aqui o Appium deste projeto e aguardamos a porta ser liberada.
    await stopProjectAppium(config.port ?? 4723);

    writeAllureEnvironment();
    // Gera o relatório HTML do Allure ao final da execução.
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
  },
};

async function waitForPortToBeFree(port: number): Promise<void> {
  if (await waitUntilFree(port, 15_000)) return;

  // O serviço do Appium encerra o servidor com SIGTERM, mas o Appium às vezes trava no desligamento
  // e fica órfão segurando a porta. Encerramos apenas um Appium iniciado por ESTE projeto.
  const orphan = findProjectAppiumOnPort(port);
  if (orphan) {
    console.warn(`Encerrando Appium órfão de execução anterior (pid ${orphan}) na porta ${port}`);
    process.kill(orphan, 'SIGKILL');
    if (await waitUntilFree(port, 10_000)) return;
  }
  throw new Error(`Porta ${port} continua ocupada por outro processo; libere-a ou altere a porta da plataforma.`);
}

async function stopProjectAppium(port: number): Promise<void> {
  const pid = findProjectAppiumOnPort(port);
  if (!pid) return;
  process.kill(pid, 'SIGTERM');
  if (!(await waitUntilFree(port, 10_000))) process.kill(pid, 'SIGKILL');
}

async function waitUntilFree(port: number, timeoutMs: number): Promise<boolean> {
  const isFree = () =>
    new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => server.close(() => resolve(true)));
      server.listen(port, '0.0.0.0');
    });

  const deadline = Date.now() + timeoutMs;
  while (!(await isFree())) {
    if (Date.now() > deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  return true;
}

function findProjectAppiumOnPort(port: number): number | undefined {
  try {
    const pids = execFileSync('lsof', ['-t', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' }).split('\n').filter(Boolean);
    const appiumBin = path.join(ROOT, 'node_modules/.bin/appium');
    return pids.map(Number).find((pid) => {
      const command = execFileSync('ps', ['-o', 'command=', '-p', String(pid)], { encoding: 'utf8' });
      return command.includes(appiumBin);
    });
  } catch {
    return undefined;
  }
}
