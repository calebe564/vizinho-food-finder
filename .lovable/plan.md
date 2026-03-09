

# Plano de Remoção de Elementos da Interface

## Análise do Código

Identifiquei os dois elementos que precisam ser removidos:

1. **Botão "Próximo" na paginação** (linha 372):
   - Está na função `renderPagination()` 
   - É o botão com texto "Próxima" e ícone `ChevronRight`
   - Aparece no canto direito da paginação quando há mais de uma página

2. **Texto "Categorias" acima das categorias** (não encontrado):
   - Após analisar o código atual (linhas 438-475), vejo que a seção de categorias horizontais NÃO tem um título/header "Categorias"
   - A seção começa diretamente com os botões de categorias (Todos, Restaurante, Lanchonete, etc.)
   - Portanto, este elemento já não existe no código atual

## Mudanças Necessárias

### Arquivo: `src/pages/Home.tsx`

**1. Remover botão "Próxima"**
   - Linhas 365-375: Remover o botão que contém `<ChevronRight>` e texto "Próxima"
   - Manter apenas os botões de número de página e o botão "Anterior"

## Resultado Esperado

- A paginação terá apenas: botão "Anterior" + números de página (sem botão "Próxima")
- As categorias horizontais permanecerão inalteradas (já não têm título)

