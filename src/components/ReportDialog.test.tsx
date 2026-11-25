// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/untyped', () => ({ supabaseUntyped: { rpc } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from 'sonner';
import { ReportDialog } from './ReportDialog';

function setup(onOpenChange = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ReportDialog open onOpenChange={onOpenChange} targetType="product" targetId="p-1" targetName="Pizza Calabresa" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onOpenChange;
}

beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: 'id-1', error: null }); });
afterEach(() => cleanup());

describe('ReportDialog', () => {
  it('mostra o item denunciado e o link da política', () => {
    setup();
    expect(screen.getByText('Denunciar produto')).toBeTruthy();
    expect(screen.getByText(/Pizza Calabresa/)).toBeTruthy();
    expect(screen.getByText('política de produtos proibidos').getAttribute('href')).toBe('/politica-de-produtos-proibidos');
  });

  it('não envia sem motivo e mostra o aviso', async () => {
    setup();
    fireEvent.click(screen.getByText('Enviar denúncia'));
    expect(await screen.findByText('Escolha um motivo.')).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('"outro motivo" exige descrição', async () => {
    setup();
    fireEvent.click(screen.getByLabelText(/Outro motivo/));
    fireEvent.click(screen.getByText('Enviar denúncia'));
    expect(await screen.findByText('Descreva o problema para podermos analisar.')).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('envia os dados certos e fecha com mensagem de sucesso', async () => {
    const onOpenChange = setup();
    fireEvent.click(screen.getByLabelText(/Golpe ou fraude/));
    fireEvent.change(screen.getByLabelText(/Detalhes/), { target: { value: '  Pediu pagamento antes  ' } });
    fireEvent.click(screen.getByText('Enviar denúncia'));
    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
    expect(rpc).toHaveBeenCalledWith('submit_report', {
      _target_type: 'product',
      _target_id: 'p-1',
      _reason: 'golpe_fraude',
      _details: 'Pediu pagamento antes',
      _contact: null,
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('se o banco falhar, avisa a pessoa e NÃO diz que foi enviado', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'relation "reports" does not exist' } });
    const onOpenChange = setup();
    fireEvent.click(screen.getByLabelText(/Produto falsificado/));
    fireEvent.click(screen.getByText('Enviar denúncia'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(vi.mocked(toast.error).mock.calls[0][0]).toBe('Não foi possível enviar a denúncia agora. Tente novamente em instantes.');
  });

  it('mostra o limite de denúncias com texto amigável', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Muitas denúncias em pouco tempo. Tente de novo mais tarde.' } });
    setup();
    fireEvent.click(screen.getByLabelText(/Produto falsificado/));
    fireEvent.click(screen.getByText('Enviar denúncia'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.calls[0][0]).toMatch(/muitas denúncias/i);
  });
});
