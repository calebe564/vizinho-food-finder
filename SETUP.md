# Comércio Vizinho - Guia de Configuração

## 🎯 Sobre o Sistema

O **Comércio Vizinho** é um PWA completo para conectar estabelecimentos locais de alimentação aos consumidores da região do Barreiro.

## 📋 Funcionalidades Implementadas

### Para Usuários (sem login necessário)
- ✅ Página inicial com banner rotativo de estabelecimentos pagantes
- ✅ Busca por nome, categoria ou produto
- ✅ Filtros por categoria e ordenação
- ✅ Listagem de estabelecimentos com cálculo de distância
- ✅ Páginas detalhadas de cada estabelecimento
- ✅ Modo claro e escuro
- ✅ PWA instalável
- ✅ Geolocalização nativa

### Para Administradores
- ✅ Sistema de login exclusivo
- ✅ Painel administrativo
- ✅ Estrutura pronta para gerenciar estabelecimentos e produtos
- ✅ Sistema de estatísticas (visualizações, cliques)

## 🔧 Configuração Inicial

### 1. Criar Conta de Administrador

Para criar a primeira conta de administrador, você precisa:

1. Primeiro, cadastrar um usuário através do Lovable Cloud (aba Cloud > Auth > Users)
2. Copiar o ID do usuário criado
3. Executar no banco de dados:

```sql
INSERT INTO admin_users (id, email)
VALUES ('COLE_O_ID_DO_USUARIO_AQUI', 'seu-email@exemplo.com');
```

### 2. Adicionar Estabelecimentos de Teste

Você pode adicionar estabelecimentos de teste no banco de dados:

```sql
INSERT INTO establishments (
  name, 
  address, 
  latitude, 
  longitude, 
  phone, 
  schedule, 
  category, 
  is_paid, 
  description
) VALUES 
(
  'Restaurante Sabor Mineiro',
  'Rua Principal, 123 - Barreiro',
  -19.9833,
  -44.0333,
  '(31) 3333-4444',
  'Seg a Sáb: 11h - 22h',
  'restaurante',
  true,
  'Comida mineira autêntica com tempero caseiro'
),
(
  'Padaria Pão Quente',
  'Av. Central, 456 - Barreiro',
  -19.9843,
  -44.0343,
  '(31) 3333-5555',
  'Todos os dias: 6h - 20h',
  'padaria',
  false,
  'Pães frescos todos os dias'
);
```

### 3. Adicionar Produtos

Após adicionar estabelecimentos, pegue o ID deles e adicione produtos:

```sql
INSERT INTO products (establishment_id, name, price, description)
VALUES 
('ID_DO_ESTABELECIMENTO', 'Feijão Tropeiro', 25.90, 'Porção individual'),
('ID_DO_ESTABELECIMENTO', 'Frango com Quiabo', 28.90, 'Acompanha arroz e feijão');
```

## 🚀 Como Usar

### Para Usuários

1. Acesse a página inicial
2. Use a busca para encontrar estabelecimentos ou produtos
3. Filtre por categoria de alimentação
4. Clique em "Ver detalhes" para mais informações
5. Clique no telefone para ligar diretamente

### Para Administradores

1. Clique no botão "Admin" no canto superior direito
2. Faça login com suas credenciais
3. Acesse o painel administrativo
4. (As interfaces de gerenciamento serão implementadas nas próximas iterações)

## 📱 Instalação do PWA

### No Android
1. Abra o site no Chrome
2. Toque no menu (⋮)
3. Selecione "Adicionar à tela inicial"
4. O app será instalado

### No iOS
1. Abra o site no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"
4. O app será instalado

## 🎨 Design System

### Cores Principais
- **Azul Primário (Modo Claro)**: #0057FF
- **Azul Neon (Modo Escuro)**: #2F8CFF
- **Fundo Claro**: #FFFFFF
- **Fundo Escuro**: #0D0D0D

### Componentes
- Cards com shadow-card e shadow-elevated
- Gradientes usando var(--gradient-primary)
- Botões com estados hover definidos no design system
- Transições suaves em todos os elementos interativos

## 🔒 Segurança

- ✅ RLS (Row Level Security) habilitado em todas as tabelas
- ✅ Apenas administradores podem editar dados
- ✅ Validação de inputs com Zod
- ✅ Autenticação segura via Lovable Cloud
- ✅ Estatísticas rastreadas automaticamente

## 📊 Banco de Dados

### Tabelas Principais
- `establishments`: Dados dos estabelecimentos
- `products`: Produtos de cada estabelecimento
- `admin_users`: Usuários administradores
- `establishment_statistics`: Estatísticas de acesso

### Triggers Automáticos
- Criação automática de estatísticas ao adicionar estabelecimento
- Atualização de timestamps

## 🌐 Recursos Offline

O PWA usa Service Workers para:
- Cache de recursos estáticos
- Funcionamento offline básico
- Carregamento mais rápido

## 📞 Próximos Passos

Para expandir o sistema, você pode:
1. Implementar as interfaces de CRUD no painel admin
2. Adicionar sistema de upload de imagens
3. Criar promoções e ofertas especiais
4. Adicionar avaliações e comentários
5. Implementar notificações push
6. Adicionar sistema de pedidos online

## 🆘 Suporte

Em caso de dúvidas, consulte a documentação do Lovable Cloud ou entre em contato com o suporte.
