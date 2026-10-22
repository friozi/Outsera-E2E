/**
 * O app mobile é integrado à versão 4 da API pública do Practice Software Testing.
 * Usamos a API apenas para preparar massa de dados; o comportamento é validado pela interface.
 */
const API_URL = process.env.API_URL ?? 'https://api-v4.practicesoftwaretesting.com';
const SETUP_TIMEOUT_MS = 30_000;

export interface Usuario {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
}

/**
 * Cria um cliente novo e isolado. Evita usar as contas compartilhadas do ambiente público,
 * que podem ser bloqueadas por terceiros após 3 tentativas de login inválidas.
 *
 * O e-mail é mantido com no máximo 30 caracteres porque o campo de e-mail do app
 * trunca valores maiores (veja "Observações" no README).
 */
export async function criarUsuario(): Promise<Usuario> {
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000)}`;
  const usuario: Usuario = {
    nome: 'Ana',
    sobrenome: 'Mobile',
    email: `qa.${id}@ex.com`,
    senha: `QaMob#${id}`,
  };

  const response = await postWithRetry(`${API_URL}/users/register`, {
    first_name: usuario.nome,
    last_name: usuario.sobrenome,
    dob: '1990-05-10',
    phone: '11999999999',
    email: usuario.email,
    password: usuario.senha,
    address: 'Kalverstraat 10',
    city: 'Amsterdam',
    state: 'Noord-Holland',
    country: 'NL',
    postcode: '1012AB',
  });
  if (response.status !== 201) {
    throw new Error(`Falha ao criar usuário de teste (${response.status}): ${await response.text()}`);
  }
  return usuario;
}

/** Repete apenas em erro de infraestrutura (5xx ou timeout), comum no ambiente público. */
async function postWithRetry(url: string, body: unknown, tentativas = 3): Promise<Response> {
  let ultimoErro: unknown;
  for (let i = 1; i <= tentativas; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(SETUP_TIMEOUT_MS),
      });
      if (response.status < 500 || i === tentativas) return response;
    } catch (erro) {
      ultimoErro = erro;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000 * i));
  }
  throw ultimoErro;
}
