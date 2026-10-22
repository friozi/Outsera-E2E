# language: pt
@checkout
Funcionalidade: Checkout de compra
  Como cliente autenticado da loja Toolshop
  Quero comprar os produtos do meu carrinho
  Para receber as ferramentas no meu endereço

  Contexto:
    Dado que existe um cliente cadastrado
    E que estou autenticado na aplicação
    E que adicionei 2 unidades de um produto em estoque ao carrinho

  @positivo @smoke
  Cenário: Compra completa com cartão de crédito válido
    Quando eu acesso o carrinho
    Então o carrinho deve conter 2 unidades do produto escolhido
    E o total do carrinho deve ser o preço unitário multiplicado pela quantidade
    Quando eu avanço para o endereço de cobrança
    E eu preencho o endereço de cobrança com dados válidos
    E eu avanço para o pagamento
    E eu escolho pagar com cartão de crédito usando dados válidos
    E eu solicito a verificação do pagamento
    Então devo ver a mensagem de pagamento aprovado
    Quando eu confirmo o pedido
    Então devo ver a confirmação do pedido com o número da fatura

  @positivo
  Esquema do Cenário: Compra completa com outros meios de pagamento - <meio de pagamento>
    Dado que estou na etapa de pagamento do checkout
    Quando eu escolho pagar com "<meio de pagamento>"
    E eu solicito a verificação do pagamento
    Então devo ver a mensagem de pagamento aprovado
    Quando eu confirmo o pedido
    Então devo ver a confirmação do pedido com o número da fatura

    Exemplos:
      | meio de pagamento |
      | Bank Transfer     |
      | Cash on Delivery  |

  @negativo
  Esquema do Cenário: Pagamento recusado por dados de cartão inválidos - <situação>
    Dado que estou na etapa de pagamento do checkout
    Quando eu preencho o cartão com número "<número>", validade "<validade>", CVV "<cvv>" e titular "<titular>"
    Então o pagamento deve exibir o erro "<mensagem>"
    E não devo conseguir verificar o pagamento

    Exemplos:
      | situação                   | número              | validade | cvv | titular   | mensagem                               |
      | número incompleto          | 4111-1111-1111      | 12/2030  | 123 | Ana Teste | Invalid card number format.            |
      | número com letras          | abcd-efgh-ijkl-mnop | 12/2030  | 123 | Ana Teste | Invalid card number format.            |
      | número sem separadores     | 4111111111111111    | 12/2030  | 123 | Ana Teste | Invalid card number format.            |
      | cartão vencido             | 4111-1111-1111-1111 | 01/2020  | 123 | Ana Teste | Expiration date must be in the future. |
      | validade com mês inválido  | 4111-1111-1111-1111 | 13/2030  | 123 | Ana Teste | Invalid date format. Use MM/YYYY.      |
      | CVV com 2 dígitos          | 4111-1111-1111-1111 | 12/2030  | 12  | Ana Teste | CVV must be 3 or 4 digits.             |

  # Defeito (BUG-01): o titular "Ana 123" é rejeitado pela validação (botão desabilitado),
  # mas a tela exibe uma caixa de erro vazia, pois o template só mostra o texto para o erro "required"
  # enquanto o campo valida apenas "pattern".
  @negativo
  Cenário: Titular do cartão com números deve informar o motivo da recusa
    Dado que estou na etapa de pagamento do checkout
    Quando eu preencho o cartão com número "4111-1111-1111-1111", validade "12/2030", CVV "123" e titular "Ana 123"
    Então não devo conseguir verificar o pagamento
    E o pagamento deve exibir o erro "Only letters and spaces are allowed."

  @negativo
  Esquema do Cenário: Endereço de entrega incompleto - <campo> em branco
    Dado que estou na etapa de endereço de cobrança do checkout
    Quando eu preencho o endereço de cobrança deixando o campo "<campo>" em branco
    Então o campo "<campo>" do endereço deve ficar inválido
    E não devo conseguir avançar para o pagamento

    Exemplos:
      | campo  |
      | rua    |
      | cidade |
      | estado |
      | CEP    |

  # Defeito (BUG-02): ao deixar um campo obrigatório do endereço em branco o botão de avançar
  # é desabilitado, mas o campo não recebe destaque visual (classe "is-invalid" do Bootstrap),
  # então o cliente não sabe qual informação está faltando.
  @negativo
  Cenário: Campo obrigatório do endereço em branco deve ser destacado para o cliente
    Dado que estou na etapa de endereço de cobrança do checkout
    Quando eu preencho o endereço de cobrança deixando o campo "rua" em branco
    Então não devo conseguir avançar para o pagamento
    E o campo "rua" do endereço deve ser destacado visualmente

  # Defeito (BUG-03): o backend recusa o pedido (HTTP 422) quando a cidade não corresponde
  # ao CEP informado, porém a tela ignora o erro ao confirmar: nenhuma mensagem é exibida e o cliente
  # fica parado na etapa de pagamento sem saber o motivo.
  @negativo
  Cenário: Pedido com cidade divergente do CEP deve informar a recusa ao cliente
    Dado que estou na etapa de endereço de cobrança do checkout
    Quando eu informo a cidade "Cidade Inexistente" que não pertence ao CEP
    E eu avanço para o pagamento
    E eu escolho pagar com cartão de crédito usando dados válidos
    E eu solicito a verificação do pagamento
    E eu confirmo o pedido
    Então devo ser informado de que o pedido não foi concluído
