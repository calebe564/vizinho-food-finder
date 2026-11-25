import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Info, Lock, Moon, Palette, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { getPlanConfig, usePlanConfigs } from '@/hooks/usePlanConfig';
import { toThemeInput, useEstablishmentTheme, useResetTheme, useSaveTheme } from '@/hooks/useEstablishmentTheme';
import {
  CORNER_STYLES,
  DARK_SURFACE,
  LIGHT_SURFACE,
  PRESET_PALETTES,
  buildMerchantTheme,
  contrastRatio,
  isValidHex,
  parseHex,
  type CornerStyle,
} from '@/lib/themeColors';
import { ThemePreview } from './ThemePreview';

const CORNER_LABELS: Record<CornerStyle, string> = { padrao: 'Padrão', reto: 'Cantos retos', arredondado: 'Cantos bem arredondados' };
const DEFAULT_PRIMARY = '#1048E8';
const DEFAULT_SECONDARY = '#F59E0B';

interface AppearanceEditorProps {
  establishmentId: string;
  establishmentName?: string;
}

function ColorField({ id, label, value, onChange, disabled }: { id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const valid = isValidHex(value);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (seletor de cor)`}
          value={valid ? value.toUpperCase() : '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          disabled={disabled}
          className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background p-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} maxLength={7} className="w-28 font-mono" aria-invalid={!valid} />
      </div>
      {!valid && !disabled && <p className="mt-1 text-xs text-destructive" role="alert">Use o formato #RRGGBB, por exemplo #1048E8.</p>}
    </div>
  );
}

/** Aparência da página pública da empresa. As cores valem só para ela. */
export function AppearanceEditor({ establishmentId, establishmentName }: AppearanceEditorProps) {
  const { data: planConfigs = [] } = usePlanConfigs();
  const { data: saved, isLoading } = useEstablishmentTheme(establishmentId);
  const save = useSaveTheme(establishmentId);
  const reset = useResetTheme(establishmentId);

  const { data: planName } = useQuery({
    queryKey: ['establishment-plan', establishmentId],
    queryFn: async () => {
      const { data } = await supabase.from('establishments').select('plan').eq('id', establishmentId).maybeSingle();
      return data?.plan ?? 'gratuito';
    },
  });

  const plan = getPlanConfig(planConfigs, planName ?? 'gratuito');
  const level = plan.customization_level;

  const [custom, setCustom] = useState(false);
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);
  const [corner, setCorner] = useState<CornerStyle>('padrao');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');

  // carrega o que já está salvo
  useEffect(() => {
    if (isLoading) return;
    setCustom(!!saved && !!(saved.primary_color || saved.secondary_color || saved.corner_style !== 'padrao'));
    setPrimary(saved?.primary_color ?? DEFAULT_PRIMARY);
    setSecondary(saved?.secondary_color ?? DEFAULT_SECONDARY);
    setCorner(saved?.corner_style ?? 'padrao');
  }, [saved, isLoading]);

  const advanced = level === 'advanced';
  const draftInput = useMemo(
    () => ({
      primary: custom && isValidHex(primary) ? primary : null,
      secondary: custom && advanced && isValidHex(secondary) ? secondary : null,
      radius: custom && advanced ? corner : null,
    }),
    [custom, advanced, primary, secondary, corner],
  );
  const built = useMemo(() => buildMerchantTheme(draftInput, level), [draftInput, level]);

  const savedInput = toThemeInput(saved);
  const changed =
    custom !== !!saved ||
    (custom &&
      ((primary.toUpperCase() !== (savedInput.primary ?? '').toUpperCase()) ||
        (advanced && secondary.toUpperCase() !== (savedInput.secondary ?? '').toUpperCase()) ||
        (advanced && corner !== (savedInput.radius ?? 'padrao'))));
  const canApply = custom ? isValidHex(primary) && (!advanced || isValidHex(secondary)) && changed : changed;

  // enquanto o plano não chega, não mostramos o convite de upgrade (piscaria para quem já tem Pro ou Max)
  if (planName === undefined) {
    return <p className="text-sm text-muted-foreground" role="status">Carregando...</p>;
  }

  if (level === 'none') {
    return (
      <Card className="border border-border rounded-2xl">
        <CardContent className="py-10 text-center space-y-3">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Personalize as cores da sua página</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Com o plano <strong>Pro</strong> você escolhe a cor principal. Com o <strong>Max</strong>, também a cor secundária e o estilo dos
            cantos. Enquanto isso, sua página usa o tema padrão do Comércio Vizinho.
          </p>
          <Button asChild>
            <Link to="/painel/planos">Ver planos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const applyPalette = (p: { primary: string; secondary: string }) => {
    setCustom(true);
    setPrimary(p.primary);
    if (advanced) setSecondary(p.secondary);
  };

  const handleApply = async () => {
    try {
      if (!custom) {
        await reset.mutateAsync();
        toast.success('Sua página voltou ao tema padrão.');
      } else {
        await save.mutateAsync({ primary, secondary: advanced ? secondary : null, corner: advanced ? corner : 'padrao' });
        toast.success('Aparência aplicada na sua página.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar a aparência.');
    }
  };

  const handleReset = async () => {
    try {
      await reset.mutateAsync();
      setCustom(false);
      toast.success('Sua página voltou ao tema padrão.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível voltar ao padrão.');
    }
  };

  const shownPrimary = built?.preview.primary?.[previewMode];
  const ratio = shownPrimary ? contrastRatio(parseHex(shownPrimary)!, previewMode === 'light' ? LIGHT_SURFACE : DARK_SURFACE) : null;

  return (
    <section aria-labelledby="aparencia-titulo" className="space-y-4">
      <div>
        <h2 id="aparencia-titulo" className="text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5" aria-hidden="true" /> Aparência da página
        </h2>
        <p className="text-sm text-muted-foreground">
          As cores valem só para a página da sua empresa. O resto do Comércio Vizinho e as páginas de outras empresas não mudam.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-border rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-base">Escolha</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <RadioGroup value={custom ? 'personalizado' : 'padrao'} onValueChange={(v) => setCustom(v === 'personalizado')} className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                <RadioGroupItem value="padrao" id="tema-padrao" />
                <Label htmlFor="tema-padrao" className="cursor-pointer">Tema padrão do Comércio Vizinho</Label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                <RadioGroupItem value="personalizado" id="tema-proprio" />
                <Label htmlFor="tema-proprio" className="cursor-pointer">Cores da minha empresa</Label>
              </div>
            </RadioGroup>

            {custom && (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Paletas prontas</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PALETTES.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => applyPalette(p)}
                        className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                        aria-label={`Usar a paleta ${p.name}`}
                      >
                        <span className="flex">
                          <span className="h-4 w-4 rounded-full border border-border" style={{ background: p.primary }} />
                          {advanced && <span className="-ml-1 h-4 w-4 rounded-full border border-border" style={{ background: p.secondary }} />}
                        </span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorField id="cor-principal" label="Cor principal" value={primary} onChange={setPrimary} />
                  <div>
                    <ColorField id="cor-secundaria" label="Cor secundária" value={secondary} onChange={setSecondary} disabled={!advanced} />
                    {!advanced && <p className="mt-1 text-xs text-muted-foreground">Disponível no plano Max.</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="estilo-cantos">Estilo dos cantos</Label>
                  <select
                    id="estilo-cantos"
                    value={corner}
                    onChange={(e) => setCorner(e.target.value as CornerStyle)}
                    disabled={!advanced}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {CORNER_STYLES.map((c) => (
                      <option key={c} value={c}>{CORNER_LABELS[c]}</option>
                    ))}
                  </select>
                  {!advanced && <p className="mt-1 text-xs text-muted-foreground">Disponível no plano Max.</p>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border rounded-2xl">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Prévia</CardTitle>
            <div className="flex gap-1" role="group" aria-label="Tema da prévia">
              <Button size="sm" variant={previewMode === 'light' ? 'default' : 'outline'} aria-pressed={previewMode === 'light'} onClick={() => setPreviewMode('light')} className="gap-1.5">
                <Sun className="h-3.5 w-3.5" aria-hidden="true" /> Claro
              </Button>
              <Button size="sm" variant={previewMode === 'dark' ? 'default' : 'outline'} aria-pressed={previewMode === 'dark'} onClick={() => setPreviewMode('dark')} className="gap-1.5">
                <Moon className="h-3.5 w-3.5" aria-hidden="true" /> Escuro
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ThemePreview theme={built} mode={previewMode} name={establishmentName} />

            <div className="space-y-1 text-xs text-muted-foreground" aria-live="polite">
              {!custom && <p>Sua página está usando o tema padrão.</p>}
              {custom && shownPrimary && ratio !== null && (
                <p>
                  Cor principal que aparece no tema {previewMode === 'light' ? 'claro' : 'escuro'}: <strong className="text-foreground">{shownPrimary}</strong> (contraste {ratio.toFixed(1)}:1; o mínimo para leitura boa é 4,5:1).
                </p>
              )}
              {built?.adjusted && (
                <p className="flex items-start gap-1.5 rounded-md bg-muted p-2 text-foreground">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Ajustamos o brilho da sua cor para o texto ficar fácil de ler nos temas claro e escuro. O tom continua o mesmo.</span>
                </p>
              )}
              <p>Isto é só uma prévia: nada muda na sua página até você clicar em "Aplicar".</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleApply} disabled={!canApply || save.isPending || reset.isPending}>
          {save.isPending || reset.isPending ? 'Salvando...' : 'Aplicar na minha página'}
        </Button>
        {saved && (
          <Button variant="outline" onClick={handleReset} disabled={reset.isPending}>
            Voltar ao tema padrão
          </Button>
        )}
      </div>
    </section>
  );
}
