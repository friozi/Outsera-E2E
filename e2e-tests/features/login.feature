# language: pt
@login
Funcionalidade: Autenticação e acesso à área do cliente
  Como cliente da loja Toolshop
  Quero acessar minha conta com e-mail e senha
  Para utilizar as funcionalidades restritas a clientes autenticados

  @positivo @smoke
  Cenário: Login com credenciais válidas
    Dado que existe um cliente cadastrado
    E que estou na página de login
    Quando eu faço login com as credenciais do cliente
    Então devo ser redirecionado para a página "My account"
    E devo ver o nome do cliente no menu de navegação

  @positivo @smoke
  Cenário: Navegar até o formulário de contato após o login
    Dado que existe um cliente cadastrado
    E que estou autenticado na aplicação
    Quando eu acesso o menu "Contact"
    Então devo estar na página do formulário de contato
    E o formulário deve estar identificado com os dados do cliente

  @positivo
  Cenário: Enviar uma mensagem pelo formulário de contato
    Dado que existe um cliente cadastrado
    E que estou autenticado na aplicação
    E que estou no formulário de contato
    Quando eu envio a mensagem "Gostaria de saber o prazo de entrega para pedidos acima de 10 itens." com o assunto "Customer service"
    Então devo ver a confirmação de envio "Thanks for your message! We will contact you shortly."

  @negativo
  Cenário: Envio do formulário de contato sem os campos obrigatórios
    Dado que existe um cliente cadastrado
    E que estou autenticado na aplicação
    E que estou no formulário de contato
    Quando eu envio o formulário de contato sem preencher os campos
    Então o campo "assunto" do contato deve exibir o erro "Subject is required"
    E o campo "mensagem" do contato deve exibir o erro "Message is required"

  @negativo
  Cenário: Login com senha incorreta
    Dado que existe um cliente cadastrado
    E que estou na página de login
    Quando eu faço login com o e-mail do cliente e a senha "SenhaErrada#123"
    Então devo ver a mensagem de erro de login "Invalid email or password"
    E devo permanecer na página de login sem estar autenticado

  @negativo
  Cenário: Login com usuário inexistente
    Dado que estou na página de login
    Quando eu faço login com um e-mail não cadastrado
    Então devo ver a mensagem de erro de login "Invalid email or password"
    E devo permanecer na página de login sem estar autenticado

  @negativo
  Cenário: Login com todos os campos obrigatórios em branco
    Dado que estou na página de login
    Quando eu faço login com o e-mail "" e a senha ""
    Então o campo "e-mail" do login deve exibir o erro "Email is required"
    E o campo "senha" do login deve exibir o erro "Password is required"
    E devo permanecer na página de login sem estar autenticado

  @negativo
  Esquema do Cenário: Validação dos campos do login - <situação>
    Dado que estou na página de login
    Quando eu faço login com o e-mail "<email>" e a senha "<senha>"
    Então o campo "<campo>" do login deve exibir o erro "<mensagem>"
    E devo permanecer na página de login sem estar autenticado

    Exemplos:
      | situação                | email                    | senha     | campo  | mensagem                |
      | e-mail em branco        |                          | Senha#123 | e-mail | Email is required       |
      | senha em branco         | cliente@example.com      |           | senha  | Password is required    |
      | e-mail sem domínio      | cliente@                 | Senha#123 | e-mail | Email format is invalid |
      | senha curta demais      | cliente@example.com      | ab        | senha  | Password length is invalid |

  @negativo @seguranca
  Cenário: Conta bloqueada após três tentativas de senha incorreta
    Dado que existe um cliente cadastrado
    E que estou na página de login
    Quando eu erro a senha do cliente 3 vezes seguidas
    E eu faço login com as credenciais do cliente
    Então devo ver a mensagem de erro de login "Account locked, too many failed attempts. Please contact the administrator."
    E devo permanecer na página de login sem estar autenticado
