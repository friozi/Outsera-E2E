import allure from '@wdio/allure-reporter';

/**
 * Executa um passo nomeado no relatório Allure e anexa um screenshot ao final dele,
 * registrando a evidência visual de cada etapa do teste.
 */
export async function passo<T>(nome: string, acao: () => Promise<T>): Promise<T> {
  return allure.step(nome, async () => {
    const resultado = await acao();
    // Anexos criados dentro do step ficam associados a ele no relatório.
    await allure.addAttachment(`📸 ${nome}`, Buffer.from(await driver.takeScreenshot(), 'base64'), 'image/png');
    return resultado;
  });
}

export async function classificar(opcoes: { feature: string; story: string; severity?: string }): Promise<void> {
  const plataforma = driver.isAndroid ? 'Android' : 'iOS';
  // Aba "Behaviors" do Allure: épico por plataforma > funcionalidade > história.
  // A aba "Suites" segue a estrutura dos describes (Tarefa 1 / Tarefa 2).
  await allure.addEpic(`App mobile Toolshop - ${plataforma}`);
  await allure.addFeature(opcoes.feature);
  await allure.addStory(opcoes.story);
  await allure.addSeverity(opcoes.severity ?? 'normal');
  await allure.addArgument('Plataforma', plataforma);
}
