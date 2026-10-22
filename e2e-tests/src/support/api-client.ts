import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { ENDERECO_CADASTRO, PRODUTOS_COM_LIMITE_POR_CLIENTE } from '../data/test-data';

const SETUP_TIMEOUT_MS = 30_000;

export interface Produto {
  id: string;
  nome: string;
}

export interface Usuario {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
}

/**
 * Cliente da API usado apenas para preparar massa de dados (setup).
 * As validações de comportamento são sempre feitas pela interface.
 */
export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly apiUrl: string,
  ) {}

  /**
   * Cria um cliente novo e isolado para o cenário.
   * Evita depender das contas compartilhadas do ambiente público, que são bloqueadas
   * após 3 tentativas de login inválidas e podem ter os dados alterados por terceiros.
   */
  async criarUsuario(): Promise<Usuario> {
    const id = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
    const usuario: Usuario = {
      nome: 'Ana',
      sobrenome: 'Teste',
      email: `qa.e2e.${id}@example.com`,
      // A API exige senha forte e não vazada (Password::uncompromised), por isso o sufixo aleatório.
      senha: `Qa#E2e${id}`,
    };

    const response = await this.postWithRetry(`${this.apiUrl}/users/register`, {
      first_name: usuario.nome,
      last_name: usuario.sobrenome,
      dob: '1990-05-10',
      phone: '11999999999',
      email: usuario.email,
      password: usuario.senha,
      address: {
        street: ENDERECO_CADASTRO.rua,
        house_number: ENDERECO_CADASTRO.numero,
        city: ENDERECO_CADASTRO.cidade,
        state: ENDERECO_CADASTRO.estado,
        country: ENDERECO_CADASTRO.pais,
        postal_code: ENDERECO_CADASTRO.cep,
      },
    });
    expect(response.status(), `Falha ao criar usuário de teste: ${await response.text()}`).toBe(201);

    return usuario;
  }

  /**
   * Escolhe um produto com estoque disponível.
   * O estoque do ambiente público é consumido pelas compras de todos os usuários (inclusive desta suíte),
   * então fixar um produto no teste o tornaria instável. O sorteio entre os disponíveis distribui o consumo.
   */
  async buscarProdutoEmEstoque(): Promise<Produto> {
    const response = await this.request.get(`${this.apiUrl}/products`, { params: { page: 1 } });
    expect(response.ok(), 'listagem de produtos').toBeTruthy();
    const { data } = (await response.json()) as {
      data: { id: string; name: string; in_stock: boolean; is_rental: boolean }[];
    };

    const disponiveis = data.filter(
      (p) => p.in_stock && !p.is_rental && !PRODUTOS_COM_LIMITE_POR_CLIENTE.includes(p.name),
    );
    // A primeira página da API corresponde aos produtos exibidos na página inicial da loja.
    expect(disponiveis.length, 'produtos em estoque na primeira página do catálogo').toBeGreaterThan(0);

    const escolhido = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    return { id: escolhido.id, nome: escolhido.name };
  }

  /**
   * Repete a chamada apenas em erros de infraestrutura (5xx ou timeout), que ocorrem esporadicamente
   * no ambiente público. Erros de validação (4xx) falham imediatamente.
   * O cadastro é lento (4-7 s, a API consulta se a senha já vazou), por isso o timeout próprio.
   */
  private async postWithRetry(url: string, data: unknown, tentativas = 3): Promise<APIResponse> {
    let ultimoErro: unknown;
    for (let i = 1; i <= tentativas; i++) {
      try {
        const response = await this.request.post(url, { data, timeout: SETUP_TIMEOUT_MS });
        if (response.status() < 500 || i === tentativas) return response;
      } catch (erro) {
        ultimoErro = erro;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000 * i));
    }
    throw ultimoErro;
  }
}
