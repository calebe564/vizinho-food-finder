# Remix of Comércio Vizinho

Crie um PWA completo chamado Comércio Vizinho, focado inicialmente no ramo de alimentação da região do Barreiro.

OBJETIVO DO PWA

Permitir que usuários encontrem facilmente estabelecimentos de alimentação próximos, vejam produtos e preços, e descubram promoções.
Somente o administrador pode cadastrar e editar empresas.
Usuários comuns não precisam de login.

O sistema não deve depender de nenhuma API externa por enquanto.
Tudo deve funcionar usando banco de dados interno, funções internas e dados registrados manualmente.

1. DESIGN E TEMA

Cores do Modo Claro (padrão do app):
	•	Azul (#0057FF) como cor principal
	•	Branco (#FFFFFF) como fundo
	•	Cinza leve (#F2F2F2) para divisões
	•	Texto preto (#000000) ou cinza escuro (#222222)

Modo Escuro (opcional, alternável pelo usuário)

Visual moderno:
	•	Fundo: #0D0D0D
	•	Cartões: #1A1A1A
	•	Acentos: azul neon (#2F8CFF)
	•	Texto: branco ou cinza claro

Botão de alternância modo claro/escuro no canto superior direito.

2. LAYOUT PRINCIPAL DO USUÁRIO (sem login)

Criar a página inicial com:

Topo — Banner Rotativo
	•	Exibe apenas estabelecimentos pagantes
	•	Carrossel automático (troca a cada 3–5 segundos)
	•	Cada banner contém:
	•	imagem
	•	nome
	•	categoria
	•	link para a página do estabelecimento

Barra de Pesquisa

Pesquisar por:
	•	nome da empresa
	•	categoria
	•	produto

A busca deve ser feita internamente, usando o banco de dados local do Lovable.

Filtros
	•	Tipo de alimentação
	•	Preço crescente/decrescente
	•	Distância (usar os valores cadastrados manualmente de latitude/longitude, mas sem API)

Lista de Estabelecimentos Próximos

Ordenada por:
	1.	Distância (calculada internamente usando as coordenadas salvas)
	2.	Relevância da busca

Cada card deve mostrar:
	•	nome
	•	distância
	•	horários
	•	telefone (clicável)
	•	alguns produtos com preços
	•	botão “Ver detalhes”

Página do Estabelecimento
	•	Nome, foto e descrição
	•	Endereço (apenas texto, sem API de mapa)
	•	Telefone
	•	Horário
	•	Lista de produtos
	•	Promoções
	•	Indicação se é pagante (destaque no layout)

3. ÁREA ADMINISTRATIVA (somente 1 conta com login)

Criar uma área de login exclusiva para administração.

Após login, o painel deve ter:

Painel Administrativo
	•	Adicionar estabelecimentos
	•	Editar estabelecimentos
	•	Remover estabelecimentos
	•	Adicionar e editar produtos e preços
	•	Marcar estabelecimento como pagante
	•	Upload de imagens (banners, fotos etc.)
	•	Registrar datas de atualização
	•	Criar categorias
	•	Ativar ou desativar estabelecimentos
	•	Ver estatísticas internas:
	•	visualizações do banner
	•	cliques
	•	estabelecimentos mais acessados

Regras essenciais
	•	Apenas o administrador edita o sistema
	•	Comerciantes não têm login
	•	Usuários não têm login

4. BANCO DE DADOS (SEM APIs)

Criar coleções internas:

Estabelecimentos
	•	id
	•	nome
	•	endereço
	•	latitude
	•	longitude
	•	telefone
	•	horário
	•	categoria
	•	lista de produtos
	•	é_pagante (true/false)
	•	imagem_banner
	•	imagem_perfil
	•	última_atualização

Produtos
	•	id
	•	estabelecimento_id
	•	nome
	•	preço
	•	imagem
	•	descrição

Admin
	•	email
	•	senha (criptografada)

5. FUNCIONALIDADES EXTRAS
	•	PWA instalável com ícone “Comércio Vizinho”
	•	Geolocalização do usuário usando apenas recursos nativos do navegador
	•	Layout responsivo
	•	Busca inteligente interna
	•	Filtros internos
	•	Carrossel para pagantes
	•	Modo claro/escuro

Nenhuma API deve ser usada.
Tudo deve rodar com os recursos internos do Lovable.

6. PUBLICAÇÃO

Gerar o PWA completo, funcional e pronto para receber domínio próprio.

INSTRUÇÃO FINAL

Crie todo o projeto completo com essa estrutura, design e funcionalidades.
O sistema deve estar pronto para funcionamento real, usando exclusivamente banco de dados interno, sem qualquer API externa

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/76c4d4b9-5ffb-47ac-8875-616c781e464b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
