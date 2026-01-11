import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { Building2, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CNPJInput } from '@/components/CNPJInput';
import { validateCNPJ } from '@/lib/validationUtils';
import { Badge } from '@/components/ui/badge';

interface EstablishmentResult {
  id: string;
  name: string;
  address: string;
  category: string;
  cnpj: string | null;
}

export default function ClaimEstablishment() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [foundEstablishment, setFoundEstablishment] = useState<EstablishmentResult | null>(null);
  const [error, setError] = useState('');
  const [hasPendingClaim, setHasPendingClaim] = useState(false);

  const handleSearch = async () => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (!validateCNPJ(cleanCnpj)) {
      setError('CNPJ inválido. Verifique os dígitos.');
      setFoundEstablishment(null);
      return;
    }

    setLoading(true);
    setError('');
    setFoundEstablishment(null);

    try {
      // Buscar estabelecimento pelo CNPJ
      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .select('id, name, address, category, cnpj')
        .eq('cnpj', cleanCnpj)
        .maybeSingle();

      if (estError) throw estError;

      if (!establishment) {
        setError('Nenhuma empresa encontrada com este CNPJ.');
        return;
      }

      // Verificar se já existe reivindicação pendente
      const { data: existingClaim } = await supabase
        .from('establishment_claims')
        .select('id, status')
        .eq('establishment_id', establishment.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existingClaim) {
        if (existingClaim.status === 'pending') {
          setHasPendingClaim(true);
          setError('Você já possui uma solicitação pendente para esta empresa.');
        } else if (existingClaim.status === 'approved') {
          setError('Você já é administrador desta empresa.');
        }
        return;
      }

      // Verificar se já tem dono
      const { data: existingOwner } = await supabase
        .from('user_establishments')
        .select('id')
        .eq('establishment_id', establishment.id)
        .eq('role', 'owner')
        .maybeSingle();

      if (existingOwner) {
        setError('Esta empresa já possui um administrador.');
        return;
      }

      setFoundEstablishment(establishment);
    } catch (err) {
      console.error('Error searching establishment:', err);
      setError('Erro ao buscar empresa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!foundEstablishment || !user) return;

    setSubmitting(true);
    try {
      const { error: claimError } = await supabase
        .from('establishment_claims')
        .insert({
          establishment_id: foundEstablishment.id,
          user_id: user.id,
          cnpj: cnpj.replace(/\D/g, ''),
          status: 'pending'
        });

      if (claimError) throw claimError;

      toast.success('Solicitação enviada! Aguarde a análise do administrador.');
      navigate('/minha-empresa');
    } catch (err) {
      console.error('Error submitting claim:', err);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    navigate('/auth', { state: { from: '/reivindicar-empresa' } });
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Reivindicar Empresa | Comércio Vizinho</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-lg mx-auto">
            <Card className="border-0 shadow-elevated rounded-3xl">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-primary/10">
                    <Building2 className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Reivindicar Empresa</CardTitle>
                <CardDescription className="text-base">
                  Digite o CNPJ da empresa que você deseja administrar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ da Empresa</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <CNPJInput
                        value={cnpj}
                        onChange={setCnpj}
                      />
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      disabled={loading || cnpj.replace(/\D/g, '').length < 14}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {foundEstablishment && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-800 dark:text-green-200">
                            Empresa Encontrada
                          </h3>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium">{foundEstablishment.name}</p>
                            <p className="text-sm text-muted-foreground">{foundEstablishment.address}</p>
                            <Badge variant="outline" className="mt-1">
                              {foundEstablishment.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Ao solicitar a administração desta empresa, nossa equipe irá verificar 
                        suas informações. Você receberá uma notificação quando sua solicitação 
                        for analisada.
                      </p>
                    </div>

                    <Button 
                      onClick={handleSubmitClaim} 
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Solicitar Administração'
                      )}
                    </Button>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => navigate('/minha-empresa')} 
                  className="w-full"
                >
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}