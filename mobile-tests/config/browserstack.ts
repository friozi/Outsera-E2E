import fs from 'node:fs';
import path from 'node:path';
import allureReporter from '@wdio/allure-reporter';

/**
 * Integração com o BrowserStack App Automate via API REST + hub W3C.
 *
 * O serviço oficial (@wdio/browserstack-service) ainda não suporta o WebdriverIO 10, então a
 * integração é feita diretamente: upload do app, nome/status da sessão e link do vídeo no Allure.
 * Credenciais via variáveis de ambiente (no CI, secrets do GitHub): nunca no código.
 */
const API = 'https://api-cloud.browserstack.com/app-automate';

export function credentials(): { user: string; key: string } {
  const user = process.env.BROWSERSTACK_USERNAME;
  const key = process.env.BROWSERSTACK_ACCESS_KEY;
  if (!user || !key) {
    throw new Error('Defina BROWSERSTACK_USERNAME e BROWSERSTACK_ACCESS_KEY para executar no BrowserStack.');
  }
  return { user, key };
}

export function buildName(): string {
  if (process.env.BROWSERSTACK_BUILD_NAME) return process.env.BROWSERSTACK_BUILD_NAME;
  if (process.env.GITHUB_RUN_NUMBER) return `CI #${process.env.GITHUB_RUN_NUMBER} (${process.env.GITHUB_REF_NAME})`;
  return `Local ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
}

/** Envia o app para o BrowserStack e retorna a referência `bs://...` usada na capability `appium:app`. */
async function uploadApp(file: string): Promise<string> {
  const { user, key } = credentials();
  const form = new FormData();
  form.append('file', await fs.openAsBlob(file), path.basename(file));
  form.append('custom_id', 'toolshop-android');

  const response = await fetch(`${API}/upload`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${user}:${key}`).toString('base64')}` },
    body: form,
  });
  const body = (await response.json()) as { app_url?: string; error?: string };
  if (!response.ok || !body.app_url) {
    throw new Error(`Falha no upload do app para o BrowserStack (${response.status}): ${body.error ?? JSON.stringify(body)}`);
  }
  console.log(`App enviado ao BrowserStack: ${body.app_url}`);
  return body.app_url;
}

function executor(action: string, args?: Record<string, unknown>) {
  return driver.execute(`browserstack_executor: ${JSON.stringify({ action, arguments: args })}`);
}

let sessionUrl: string | undefined;
let failures = 0;

/** Hooks da execução no BrowserStack, combinados com os hooks compartilhados. */
export function browserstackHooks(appFile: string): Partial<WebdriverIO.Config> {
  return {
    async onPrepare(_config, capabilities) {
      // BROWSERSTACK_APP_URL permite reutilizar um upload já feito (bs://...).
      const appUrl = process.env.BROWSERSTACK_APP_URL ?? (await uploadApp(appFile));
      for (const capability of capabilities as WebdriverIO.Capabilities[]) {
        capability['appium:app'] = appUrl;
      }
    },

    async before(_capabilities, specs) {
      // Uma sessão por arquivo de teste: o nome da sessão identifica a tarefa no painel do BrowserStack.
      await executor('setSessionName', { name: path.basename(specs[0]).replace('.spec.ts', '') });
      const details = JSON.parse((await executor('getSessionDetails')) as string) as { public_url?: string };
      sessionUrl = details.public_url;
    },

    async afterTest(_test, _context, { passed }) {
      if (!passed) failures++;
      // Link para o vídeo, logs e capturas da sessão no BrowserStack.
      if (sessionUrl) await allureReporter.addLink(sessionUrl, 'Sessão no BrowserStack (vídeo e logs)');
    },

    async after() {
      await executor('setSessionStatus', failures
        ? { status: 'failed', reason: `${failures} teste(s) falharam` }
        : { status: 'passed', reason: 'Todos os testes passaram' });
    },
  };
}
