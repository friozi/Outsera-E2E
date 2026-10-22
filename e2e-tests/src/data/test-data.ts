/**
 * Rua, cidade e estado são opcionais: quando omitidos, mantém-se o preenchimento automático
 * feito pela consulta de CEP (comportamento esperado de um cliente real).
 */
export interface Endereco {
  pais: string;
  cep: string;
  numero: string;
  rua?: string;
  cidade?: string;
  estado?: string;
}

export interface CartaoDeCredito {
  numero: string;
  validade: string;
  cvv: string;
  titular: string;
}

/**
 * Endereço holandês: o país possui consulta de CEP na API.
 * O backend rejeita o pedido se cidade/estado não corresponderem ao retorno dessa consulta,
 * por isso o endereço válido usa os dados preenchidos automaticamente pela aplicação.
 */
export const ENDERECO_VALIDO: Endereco = {
  pais: 'NL',
  cep: '1012AB',
  numero: '10',
};

/** Endereço usado no cadastro do cliente via API (pré-preenchido no checkout). */
export const ENDERECO_CADASTRO: Required<Endereco> = {
  ...ENDERECO_VALIDO,
  rua: 'Kalverstraat',
  cidade: 'Amsterdam',
  estado: 'Noord-Holland',
};

export const CARTAO_VALIDO: CartaoDeCredito = {
  numero: '4111-1111-1111-1111',
  validade: `12/${new Date().getFullYear() + 3}`,
  cvv: '123',
  titular: 'Ana Teste',
};

/**
 * Produtos com limite de compra por cliente (regra exibida só na descrição do produto,
 * não exposta pela API). Não servem para cenários que adicionam mais de uma unidade.
 */
export const PRODUTOS_COM_LIMITE_POR_CLIENTE = ['Thor Hammer'];

export const MENSAGENS = {
  loginInvalido: 'Invalid email or password',
  contaBloqueada: 'Account locked, too many failed attempts. Please contact the administrator.',
  pagamentoAprovado: 'Payment was successful',
  pedidoConfirmado: /Thanks for your order! Your invoice number is (INV-\d+)/,
  contatoEnviado: 'Thanks for your message! We will contact you shortly.',
} as const;
