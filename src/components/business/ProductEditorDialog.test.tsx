// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MerchantProduct } from '@/lib/products';

// o jsdom não tem ResizeObserver, que o componente de interruptor (Radix) usa
vi.hoisted(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const save = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
vi.mock('@/hooks/useMerchantProducts', () => ({ useSaveProduct: () => save }));
vi.mock('@/lib/imageUpload', () => ({ uploadPublicImage: vi.fn(), validateImageFile: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from 'sonner';
import { ProductEditorDialog } from './ProductEditorDialog';

const existing: MerchantProduct = {
  id: 'p1', name: 'Pizza', description: 'Boa', price: 8, image: 'https://img/x.jpg', unit: null, category: 'Pizzas',
  is_available: true, is_promotion: false, promotion_description: null, promotion_expiration: null, created_at: null,
  product_variations: [{ id: 'v1', name: 'Média', price: 8 }, { id: 'v2', name: 'Grande', price: 12 }],
};

function setup(product: MerchantProduct | null = null, onOpenChange = vi.fn()) {
  render(<ProductEditorDialog open onOpenChange={onOpenChange} establishmentId="e1" product={product} categorySuggestions={['Bebidas']} />);
  return onOpenChange;
}

beforeEach(() => { vi.clearAllMocks(); save.mutateAsync.mockResolvedValue('p9'); });
afterEach(() => cleanup());

describe('ProductEditorDialog', () => {
  it('produto novo: não salva sem nome e mostra o erro', async () => {
    setup();
    expect(screen.getByText('Adicionar produto', { selector: 'h2' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar produto' }));
    expect(await screen.findByText('Nome muito curto')).toBeTruthy();
    expect(save.mutateAsync).not.toHaveBeenCalled();
  });

  it('produto simples sem preço não é aceito', async () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText('Ex.: Pão francês'), { target: { value: 'Pão francês' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar produto' }));
    expect(await screen.findByText('Preço deve ser maior que 0')).toBeTruthy();
    expect(save.mutateAsync).not.toHaveBeenCalled();
  });

  it('editar: abre com os dados do produto, variações e foto', () => {
    setup(existing);
    expect(screen.getByText('Editar produto')).toBeTruthy();
    expect((screen.getByPlaceholderText('Ex.: Pão francês') as HTMLInputElement).value).toBe('Pizza');
    expect((screen.getByLabelText('Nome da variação 1') as HTMLInputElement).value).toBe('Média');
    expect((screen.getByLabelText('Nome da variação 2') as HTMLInputElement).value).toBe('Grande');
    expect(screen.getByAltText('Foto do produto').getAttribute('src')).toBe('https://img/x.jpg');
  });

  it('editar e salvar envia o produto existente e fecha com aviso de sucesso', async () => {
    const onOpenChange = setup(existing);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(save.mutateAsync).toHaveBeenCalledTimes(1));
    const arg = save.mutateAsync.mock.calls[0][0];
    expect(arg.existing.id).toBe('p1');
    expect(arg.imageUrl).toBe('https://img/x.jpg');
    expect(arg.values).toMatchObject({ name: 'Pizza', category: 'Pizzas', hasVariations: true, is_available: true });
    expect(arg.values.variations).toHaveLength(2);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Produto atualizado'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('se salvar falhar (ex.: limite do plano), mostra a mensagem e mantém o formulário aberto', async () => {
    save.mutateAsync.mockRejectedValue(new Error('Limite de 15 produtos do plano atual atingido. Escolha um plano maior para cadastrar mais.'));
    const onOpenChange = setup(existing);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/^Limite de 15 produtos/)));
    expect(toast.success).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('remover a foto zera a imagem enviada', async () => {
    setup(existing);
    fireEvent.click(screen.getByText('Remover foto'));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(save.mutateAsync).toHaveBeenCalled());
    expect(save.mutateAsync.mock.calls[0][0].imageUrl).toBeNull();
  });

  it('sugere categorias que a empresa já usa', () => {
    setup();
    const options = Array.from(document.querySelectorAll('datalist option')).map((o) => o.getAttribute('value'));
    expect(options).toEqual(['Bebidas']);
  });
});
