// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { MerchantProduct } from '@/lib/products';
import { DEFAULT_CONFIGS } from '@/hooks/usePlanConfig';

const state = vi.hoisted(() => ({
  products: [] as unknown[],
  plan: 'start',
  toggle: vi.fn(),
  remove: vi.fn(),
  editorProps: null as unknown,
}));

vi.mock('@/hooks/useMerchantProducts', () => ({
  useMerchantProducts: () => ({ data: state.products, isLoading: false, isError: false, refetch: vi.fn() }),
  useToggleAvailability: () => ({ mutate: state.toggle, isPending: false }),
  useDeleteProduct: () => ({ mutateAsync: state.remove, isPending: false }),
}));
vi.mock('@/hooks/usePlanConfig', async (orig) => ({
  ...(await orig<typeof import('@/hooks/usePlanConfig')>()),
  usePlanConfigs: () => ({ data: DEFAULT_CONFIGS }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan: state.plan } }) }) }) }) },
}));
vi.mock('./ProductEditorDialog', () => ({
  ProductEditorDialog: (props: { open: boolean; product?: MerchantProduct | null }) => {
    state.editorProps = props;
    return props.open ? <div data-testid="editor">{props.product ? `editando ${props.product.name}` : 'novo produto'}</div> : null;
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ProductsManager } from './ProductsManager';

const make = (n: number, extra: Partial<MerchantProduct> = {}): MerchantProduct[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`, name: `Produto ${i}`, description: null, price: 10 + i, image: null, unit: null, category: null,
    is_available: true, is_promotion: false, promotion_description: null, promotion_expiration: null, created_at: null,
    product_variations: [], ...extra,
  }));

function renderIt() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProductsManager establishmentId="e1" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => { vi.clearAllMocks(); state.plan = 'start'; state.products = []; });
afterEach(() => cleanup());

describe('ProductsManager', () => {
  it('lista vazia: convida a cadastrar o primeiro produto', async () => {
    renderIt();
    expect(await screen.findByText('Nenhum produto cadastrado ainda')).toBeTruthy();
    fireEvent.click(screen.getByText('Adicionar o primeiro produto'));
    expect(screen.getByTestId('editor').textContent).toBe('novo produto');
  });

  it('mostra quantos produtos tem, o limite e quantos restam (plano Start = 15)', async () => {
    state.products = make(10);
    renderIt();
    await waitFor(() => expect(screen.getByText(/5 restantes/)).toBeTruthy());
    expect(screen.getByText(/de 15 produtos cadastrados/)).toBeTruthy();
    expect(screen.getByText('Adicionar produto').closest('button')?.hasAttribute('disabled')).toBe(false);
  });

  it('no limite do plano: não deixa adicionar, explica e leva aos planos', async () => {
    state.products = make(15);
    renderIt();
    await waitFor(() => expect(screen.getByText(/Você chegou ao limite de produtos do plano Start/)).toBeTruthy());
    expect(screen.getByText('Adicionar produto').closest('button')?.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('veja os planos').getAttribute('href')).toBe('/painel/planos');
    // editar e excluir continuam possíveis
    expect(screen.getByLabelText('Editar Produto 0')).toBeTruthy();
  });

  it('mostra preço, "a partir de" com variações, promoção e indisponível', async () => {
    state.products = [
      ...make(1, { id: 'a', name: 'Pizza', product_variations: [{ name: 'M', price: 8 }, { name: 'G', price: 12 }] }),
      ...make(1, { id: 'b', name: 'Bolo', is_available: false }),
      ...make(1, { id: 'c', name: 'Pão', is_promotion: true, promotion_expiration: new Date(Date.now() + 864e5).toISOString() }),
    ];
    renderIt();
    expect(await screen.findByText(/a partir de R\$\s?8,00/)).toBeTruthy();
    expect(screen.getByText('Indisponível')).toBeTruthy();
    expect(screen.getByText('Promoção')).toBeTruthy();
  });

  it('o interruptor muda a disponibilidade', async () => {
    state.products = make(1);
    renderIt();
    fireEvent.click(await screen.findByLabelText('Disponível: Produto 0'));
    expect(state.toggle).toHaveBeenCalledWith({ productId: 'p0', available: false }, expect.anything());
  });

  it('excluir pede confirmação antes', async () => {
    state.products = make(1);
    state.remove.mockResolvedValue(undefined);
    renderIt();
    fireEvent.click(await screen.findByLabelText('Excluir Produto 0'));
    expect(state.remove).not.toHaveBeenCalled();
    expect(await screen.findByText('Excluir produto?')).toBeTruthy();
    fireEvent.click(screen.getByText('Excluir'));
    await waitFor(() => expect(state.remove).toHaveBeenCalledWith('p0'));
  });

  it('editar abre o editor com o produto certo', async () => {
    state.products = make(2);
    renderIt();
    fireEvent.click(await screen.findByLabelText('Editar Produto 1'));
    expect(screen.getByTestId('editor').textContent).toBe('editando Produto 1');
  });
});
