import path from 'node:path';
import net from 'node:net';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(__dirname, '..');
const APPIUM_BIN = path.join(ROOT, 'node_modules/.bin/appium');
export const LOCAL_APPIUM_VERSION: string = require('appium/package.json').version;

// Drivers do Appium ficam instalados no projeto (versão reprodutível, sem instalação global).
process.env.APPIUM_HOME ??= path.join(ROOT, '.appium');

/**
 * Execução com Appium local (emulador/simulador nesta máquina ou no runner de CI).
 * Cada plataforma usa a sua porta, para que execuções em sequência não disputem o mesmo servidor.
 */
export function localAppium(port: number): Pick<WebdriverIO.Config, 'port' | 'services' | 'onPrepare' | 'onComplete'> {
  return {
    port,
    services: [
      [
        'appium',
        {
          command: APPIUM_BIN,
          args: { port, logLevel: 'warn' },
          logPath: path.join(ROOT, 'logs'),
        },
      ],
    ],
    // Roda antes do serviço do Appium: se o servidor de uma execução anterior ainda está encerrando,
    // aguarda a porta ser liberada em vez de falhar com EADDRINUSE.
    onPrepare: () => waitForPortToBeFree(port),
    // O serviço do Appium nem sempre consegue encerrar o servidor antes de o WDIO sair, deixando-o
    // órfão na porta. Encerramos aqui o Appium deste projeto e aguardamos a porta ser liberada.
    onComplete: () => stopProjectAppium(port),
  };
}

async function waitForPortToBeFree(port: number): Promise<void> {
  if (await waitUntilFree(port, 15_000)) return;

  // Encerramos apenas um Appium iniciado por ESTE projeto, nunca processos de terceiros.
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
    const pids = execFileSync('lsof', ['-t', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    return pids.map(Number).find((pid) => {
      const command = execFileSync('ps', ['-o', 'command=', '-p', String(pid)], { encoding: 'utf8' });
      return command.includes(APPIUM_BIN);
    });
  } catch {
    return undefined;
  }
}
