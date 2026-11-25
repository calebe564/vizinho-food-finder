// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DEFAULT_CONFIGS } from '@/hooks/usePlanConfig';

const state = vi.hoisted(() => ({
  plan: 'pro',
  saved: null as null | Record<string, unknown>,
  save: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { plan: state.plan } }) }) }) }) },
}));
vi.mock('@/hooks/usePlanConfig', async (orig) => ({
  ...(await orig<typeof import('@/hooks/usePlanConfig')>()),
  usePlanConfigs: () => ({ data: DEFAULT_CONFIGS }),
}));
vi.mock('@/hooks/useEstablishmentTheme', async (orig) => ({
  ...(await orig<typeof import('@/hooks/useEstablishmentTheme')>()),
  useEstablishmentTheme: () => ({ data: state.saved, isLoading: false }),
  useSaveTheme: () => ({ mutateAsync: state.save, isPending: false }),
  useResetTheme: () => ({ mutateAsync: state.reset, isPending: false }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from 'sonner';
import { AppearanceEditor } from './AppearanceEditor';

function renderIt() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AppearanceEditor establishmentId="e1" establishmentName="Padaria do Zé" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const choose = async (label: RegExp) => fireEvent.click(await screen.findByLabelText(label));
const apply = () => screen.getByRole('button', { name: 'Aplicar na minha página' });

beforeEach(() => { vi.clearAllMocks(); state.plan = 'pro'; state.saved = null; state.save.mockResolvedValue(undefined); state.reset.mockResolvedValue(undefined); });
afterEach(() => cleanup());

describe('AppearanceEditor: planos', () => {
  it('enquanto o plano carrega, não mostra o convite de upgrade', async () => {
    state.plan = 'pro';
    renderIt();
    expect(screen.queryByText('Personalize as cores da sua página')).toBeNull();
    expect(screen.getByText('Carregando...')).toBeTruthy();
    await screen.findByLabelText(/Tema padrão do Comércio Vizinho/);
    expect(screen.queryByText('Personalize as cores da sua página')).toBeNull();
  });

  it('Start (sem personalização): mostra o convite e leva aos planos, sem controles', async () => {
    state.plan = 'start';
    renderIt();
    expect(await screen.findByText('Personalize as cores da sua página')).toBeTruthy();
    expect(screen.getByText('Ver planos').closest('a')?.getAttribute('href')).toBe('/painel/planos');
    expect(screen.queryByLabelText('Cor principal')).toBeNull();
  });

  it('Pro: cor principal liberada; secundária e cantos bloqueadas com aviso do plano Max', async () => {
    renderIt();
    await choose(/Cores da minha empresa/);
    expect((await screen.findByLabelText('Cor principal') as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByLabelText('Cor secundária') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Estilo dos cantos') as HTMLSelectElement).disabled).toBe(true);
    expect(screen.getAllByText('Disponível no plano Max.')).toHaveLength(2);
  });

  it('Max: tudo liberado', async () => {
    state.plan = 'max';
    renderIt();
    await choose(/Cores da minha empresa/);
    await screen.findByLabelText('Cor principal');
    expect((screen.getByLabelText('Cor secundária') as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByLabelText('Estilo dos cantos') as HTMLSelectElement).disabled).toBe(false);
  });
});

describe('AppearanceEditor: prévia e legibilidade', () => {
  it('nada é aplicado até clicar em Aplicar (só prévia)', async () => {
    renderIt();
    await choose(/Cores da minha empresa/);
    fireEvent.change(await screen.findByLabelText('Cor principal'), { target: { value: '#15803D' } });
    expect(state.save).not.toHaveBeenCalled();
    expect(screen.getByText(/nada muda na sua página até você clicar em "Aplicar"/)).toBeTruthy();
    expect(screen.getByTestId('theme-preview')).toBeTruthy();
  });

  it('cor ilegível (amarelo) é ajustada e a pessoa é avisada, com o contraste real', async () => {
    renderIt();
    await choose(/Cores da minha empresa/);
    fireEvent.change(await screen.findByLabelText('Cor principal'), { target: { value: '#FACC15' } });
    expect(await screen.findByText(/Ajustamos o brilho da sua cor/)).toBeTruthy();
    const info = screen.getByText(/Cor principal que aparece no tema claro/).textContent!;
    const ratio = parseFloat(info.match(/contraste ([\d.]+):1/)![1]);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('mostra a cor real também no tema escuro', async () => {
    renderIt();
    await choose(/Cores da minha empresa/);
    await screen.findByLabelText('Cor principal');
    fireEvent.click(screen.getByRole('button', { name: /Escuro/ }));
    expect(await screen.findByText(/Cor principal que aparece no tema escuro/)).toBeTruthy();
  });

  it('hexadecimal inválido: avisa e não deixa aplicar', async () => {
    renderIt();
    await choose(/Cores da minha empresa/);
    fireEvent.change(await screen.findByLabelText('Cor principal'), { target: { value: 'azul' } });
    expect(await screen.findByText(/Use o formato #RRGGBB/)).toBeTruthy();
    expect((apply() as HTMLButtonElement).disabled).toBe(true);
  });

  it('paleta pronta preenche as cores (Pro só a principal)', async () => {
    renderIt();
    await choose(/Cores da minha empresa/);
    fireEvent.click(await screen.findByLabelText('Usar a paleta Rosa'));
    expect((screen.getByLabelText('Cor principal') as HTMLInputElement).value).toBe('#DB2777');
    expect((screen.getByLabelText('Cor secundária') as HTMLInputElement).disabled).toBe(true);
  });
});

describe('AppearanceEditor: salvar e voltar ao padrão', () => {
  it('Pro aplica só a cor principal', async () => {
    renderIt();
    await choose(/Cores da minha empresa/);
    fireEvent.change(await screen.findByLabelText('Cor principal'), { target: { value: '#15803D' } });
    fireEvent.click(apply());
    await waitFor(() => expect(state.save).toHaveBeenCalledWith({ primary: '#15803D', secondary: null, corner: 'padrao' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Aparência aplicada na sua página.'));
  });

  it('Max aplica principal, secundária e cantos', async () => {
    state.plan = 'max';
    renderIt();
    await choose(/Cores da minha empresa/);
    fireEvent.change(await screen.findByLabelText('Cor principal'), { target: { value: '#7C3AED' } });
    fireEvent.change(screen.getByLabelText('Cor secundária'), { target: { value: '#10B981' } });
    fireEvent.change(screen.getByLabelText('Estilo dos cantos'), { target: { value: 'reto' } });
    fireEvent.click(apply());
    await waitFor(() => expect(state.save).toHaveBeenCalledWith({ primary: '#7C3AED', secondary: '#10B981', corner: 'reto' }));
  });

  it('se o banco recusar (ex.: plano mudou), mostra a mensagem e não diz que aplicou', async () => {
    state.save.mockRejectedValue(new Error('O plano atual não inclui personalização visual. Veja os planos Pro e Max.'));
    renderIt();
    await choose(/Cores da minha empresa/);
    fireEvent.change(await screen.findByLabelText('Cor principal'), { target: { value: '#15803D' } });
    fireEvent.click(apply());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/não inclui personalização/)));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('carrega o tema salvo e permite voltar ao padrão', async () => {
    state.saved = { establishment_id: 'e1', primary_color: '#DB2777', secondary_color: null, corner_style: 'padrao' };
    renderIt();
    await waitFor(() => expect((screen.getByLabelText('Cor principal') as HTMLInputElement).value).toBe('#DB2777'));
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao tema padrão' }));
    await waitFor(() => expect(state.reset).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Sua página voltou ao tema padrão.'));
  });

  it('escolher "tema padrão" e aplicar remove o tema salvo', async () => {
    state.saved = { establishment_id: 'e1', primary_color: '#DB2777', secondary_color: null, corner_style: 'padrao' };
    renderIt();
    await screen.findByDisplayValue('#DB2777');
    await choose(/Tema padrão do Comércio Vizinho/);
    fireEvent.click(apply());
    await waitFor(() => expect(state.reset).toHaveBeenCalledTimes(1));
    expect(state.save).not.toHaveBeenCalled();
  });
});
