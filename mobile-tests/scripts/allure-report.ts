/**
 * Gera o relatório Allure a partir de allure-results já existentes.
 * Usado no CI para juntar os resultados de Android (BrowserStack) e iOS (simulador) em um só relatório.
 */
import { generateAllureReport, writeAllureEnvironment } from '../config/wdio.shared.conf';

writeAllureEnvironment();
generateAllureReport().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
