import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { 
  Building2, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Search,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Hash,
  FileText
} from 'lucide-react';
import { DocumentInput, type DocumentLookupResult, type CPFFormData } from '@/components/DocumentInput';
import { validateDocument, validateAge, type DocumentType } from '@/lib/validationUtils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Step indicator component
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  const progress = ((currentStep) / totalSteps) * 100;
  
  return (
    <div className="space-y-2">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        {labels.map((label, index) => (
          <span 
            key={index} 
            className={`${index + 1 <= currentStep ? 'text-primary font-medium' : ''}`}
          >
            {index + 1}. {label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface DocumentData {
  documentType: DocumentType;
  razaoSocial?: string;
  nomeFantasia?: string;
  situacao?: string;
  municipio?: string;
  uf?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  // CPF specific
  nomeCompleto?: string;
  dataNascimento?: string;
}

interface RequesterData {
  nome: string;
  whatsapp: string;
  email: string;
  cargo: string;
}

interface EstablishmentResult {
  id: string;
  name: string;
  address: string;
  category: string;
  neighborhood: string | null;
  city: string;
}

const STEP_LABELS = ['Documento', 'Confirmar', 'Seus Dados', 'Selecionar', 'Enviar'];

export default function ClaimEstablishment() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { role, isLoading: roleLoading, isAdmin } = useUserRole();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Document (CNPJ or CPF)
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('unknown');
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [cpfFormData, setCpfFormData] = useState<CPFFormData>({
    nomeCompleto: profile?.full_name || '',
    dataNascimento: '',
    endereco: '',
    telefone: '',
    categoria: '',
  });
  
  // Step 2: Document Data confirmation
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  
  // Step 3: Requester Data (PRIVATE)
  const [requesterData, setRequesterData] = useState<RequesterData>({
    nome: profile?.full_name || '',
    whatsapp: '',
    email: profile?.email || '',
    cargo: '',
  });
  
  // Step 4: Search and Select
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [establishments, setEstablishments] = useState<EstablishmentResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<EstablishmentResult | null>(null);
  
  // Step 5: Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualCnpjData, setManualCnpjData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    endereco: '',
    telefone: '',
    cidade: '',
    uf: '',
  });

  // Pre-fill user data
  useEffect(() => {
    if (profile) {
      setRequesterData(prev => ({
        ...prev,
        nome: profile.full_name || prev.nome,
        email: profile.email || prev.email,
      }));
      setCpfFormData(prev => ({
        ...prev,
        nomeCompleto: profile.full_name || prev.nomeCompleto,
      }));
    }
  }, [profile]);

  // Block admins from claiming
  useEffect(() => {
    if (!roleLoading && isAdmin) {
      toast.error('Administradores não podem reivindicar empresas.');
      navigate('/admin/dashboard');
    }
  }, [roleLoading, isAdmin, navigate]);

  // Step 1: Validate document and fetch data from API (for CNPJ)
  const handleDocumentAdvance = async () => {
    const cleanDocument = document.replace(/\D/g, '');
    
    const validation = validateDocument(cleanDocument);
    if (!validation.isValid) {
      setError('Documento inválido. Verifique os dígitos.');
      return;
    }

    setError('');

    // For CPF, validate age and move to step 2
    if (validation.type === 'cpf') {
      if (!cpfFormData.dataNascimento) {
        setError('Data de nascimento é obrigatória para CPF.');
        return;
      }
      if (!validateAge(cpfFormData.dataNascimento)) {
        setError('Você deve ter pelo menos 18 anos para reivindicar uma empresa.');
        return;
      }
      if (!cpfFormData.nomeCompleto.trim()) {
        setError('Nome completo é obrigatório.');
        return;
      }

      setDocumentData({
        documentType: 'cpf',
        nomeCompleto: cpfFormData.nomeCompleto,
        dataNascimento: cpfFormData.dataNascimento,
      });
      setCurrentStep(2);
      return;
    }

    // For CNPJ, fetch from API
    setLoadingDocument(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanDocument}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          setError('API de consulta temporariamente indisponível. Tente novamente em alguns minutos.');
          return;
        }
        throw new Error('Erro ao consultar CNPJ');
      }

      const data = await response.json();

      if (data.status === 'ERROR') {
        setError(data.message || 'CNPJ não encontrado na Receita Federal.');
        return;
      }

      // Store CNPJ data
      setDocumentData({
        documentType: 'cnpj',
        razaoSocial: data.nome || '',
        nomeFantasia: data.fantasia || '',
        situacao: data.situacao || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        bairro: data.bairro || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
      });

      // Auto-fill search city
      if (data.municipio) {
        setSearchCity(data.municipio);
      }

      // Advance to step 2
      setCurrentStep(2);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Consulta demorou muito. Você pode tentar novamente ou preencher manualmente.');
      } else {
        setError('Erro ao consultar CNPJ. Você pode tentar novamente ou preencher manualmente.');
      }
      setShowManualFallback(true);
    } finally {
      setLoadingDocument(false);
    }
  };

  // Manual CNPJ fallback - advance without API
  const handleManualCnpjAdvance = () => {
    if (!manualCnpjData.razaoSocial.trim()) {
      setError('Razão Social é obrigatória.');
      return;
    }
    if (!manualCnpjData.cidade.trim()) {
      setError('Cidade é obrigatória.');
      return;
    }

    setDocumentData({
      documentType: 'cnpj',
      razaoSocial: manualCnpjData.razaoSocial,
      nomeFantasia: manualCnpjData.nomeFantasia,
      situacao: 'NÃO VERIFICADO',
      municipio: manualCnpjData.cidade,
      uf: manualCnpjData.uf,
      logradouro: manualCnpjData.endereco,
    });

    setSearchCity(manualCnpjData.cidade);
    setError('');
    setShowManualFallback(false);
    setCurrentStep(2);
  };

  // Step 2: Confirm document data
  const handleConfirmDocumentData = () => {
    if (!documentData) return;
    
    if (documentData.documentType === 'cnpj' && documentData.situacao !== 'ATIVA') {
      toast.warning(`CNPJ com situação: ${documentData.situacao}. Você pode continuar, mas isso pode afetar a aprovação.`);
    }
    
    setCurrentStep(3);
  };

  // Step 3: Validate requester data
  const handleRequesterAdvance = () => {
    console.log("=== DEBUG REIVINDICAÇÃO - ETAPA 3 → 4 ===");
    console.log("requesterData:", JSON.stringify(requesterData));
    console.log("documentData:", JSON.stringify(documentData));
    console.log("document:", document);
    console.log("documentType:", documentType);
    console.log("user_id:", user?.id);

    if (!requesterData.nome.trim()) {
      setError('Nome completo é obrigatório.');
      return;
    }
    if (!requesterData.whatsapp.trim()) {
      setError('WhatsApp é obrigatório.');
      return;
    }
    if (!requesterData.email.trim()) {
      setError('E-mail é obrigatório.');
      return;
    }
    if (!requesterData.cargo.trim()) {
      setError('Cargo na empresa é obrigatório.');
      return;
    }
    
    setError('');
    console.log("Avançando para etapa 4...");
    setCurrentStep(4);
  };

  // Step 4: Search establishments
  const handleSearch = async () => {
    setLoadingSearch(true);
    setError('');
    setSelectedEstablishment(null);

    try {
      let query = supabase
        .from('establishments')
        .select('id, name, address, category, neighborhood, city')
        .eq('active', true);

      if (searchTerm.trim()) {
        query = query.ilike('name', `%${searchTerm.trim()}%`);
      }
      if (searchCategory && searchCategory !== '') {
        query = query.eq('category', searchCategory as "acai" | "açougue" | "bar" | "cafe" | "espetinho" | "hamburgueria" | "hortifruti" | "lanchonete" | "outro" | "padaria" | "pizzaria" | "restaurante" | "sorveteria" | "supermercado");
      }
      if (searchCity.trim()) {
        query = query.ilike('city', `%${searchCity.trim()}%`);
      }

      query = query.limit(20);

      const { data, error: searchError } = await query;

      if (searchError) throw searchError;

      if (!data || data.length === 0) {
        setError('Nenhuma empresa encontrada com esses critérios.');
        setEstablishments([]);
      } else {
        setEstablishments(data);
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError('Erro ao buscar empresas.');
    } finally {
      setLoadingSearch(false);
    }
  };

  // Step 4: Select establishment
  const handleSelectEstablishment = async (establishment: EstablishmentResult) => {
    // Check if already has owner
    const { data: existingOwner } = await supabase
      .from('user_establishments')
      .select('id')
      .eq('establishment_id', establishment.id)
      .eq('role', 'owner')
      .maybeSingle();

    if (existingOwner) {
      toast.error('Esta empresa já possui um proprietário.');
      return;
    }

    // Check if user already has pending claim
    const { data: existingClaim } = await supabase
      .from('establishment_claims')
      .select('id, status')
      .eq('establishment_id', establishment.id)
      .eq('user_id', user?.id)
      .maybeSingle();

    if (existingClaim) {
      if (existingClaim.status === 'pending') {
        toast.error('Você já possui uma solicitação pendente para esta empresa.');
        return;
      }
      if (existingClaim.status === 'approved') {
        toast.error('Você já é o proprietário desta empresa.');
        return;
      }
    }

    setSelectedEstablishment(establishment);
    setCurrentStep(5);
  };

  // Step 5: Submit claim
  const handleSubmitClaim = async () => {
    console.log("=== DEBUG REIVINDICAÇÃO - SUBMIT ===");
    console.log("selectedEstablishment:", JSON.stringify(selectedEstablishment));
    console.log("user_id:", user?.id);
    console.log("document:", document);
    console.log("documentType:", documentType);
    console.log("requesterData:", JSON.stringify(requesterData));
    console.log("cpfFormData:", JSON.stringify(cpfFormData));

    if (!selectedEstablishment || !user) {
      console.error("ERRO: selectedEstablishment ou user é null", { selectedEstablishment, user: user?.id });
      setError('Dados incompletos. Volte e tente novamente.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const cleanDocument = document.replace(/\D/g, '');
      
      const insertData = {
        establishment_id: selectedEstablishment.id,
        user_id: user.id,
        cnpj: cleanDocument,
        cpf_hash: documentType === 'cpf' ? cleanDocument : null,
        document_type: documentType,
        birth_date: documentType === 'cpf' && cpfFormData.dataNascimento ? cpfFormData.dataNascimento : null,
        status: 'pending',
        requester_name: requesterData.nome,
        requester_whatsapp: requesterData.whatsapp,
        requester_email: requesterData.email,
        requester_role: requesterData.cargo,
      };

      console.log("INSERT DATA:", JSON.stringify(insertData));

      const { error: claimError } = await supabase
        .from('establishment_claims')
        .insert(insertData);

      if (claimError) {
        console.error("ERRO SUPABASE:", JSON.stringify(claimError));
        setError(`Erro ao enviar: ${claimError.message} (code: ${claimError.code}, details: ${claimError.details})`);
        return;
      }

      console.log("Reivindicação enviada com sucesso!");
      toast.success('Reivindicação enviada com sucesso! Aguarde a análise do administrador.');
      navigate('/minha-empresa');
    } catch (err: any) {
      console.error('Erro real ao enviar reivindicação:', err);
      const msg = err?.message || err?.details || 'Erro desconhecido';
      setError(`Erro ao enviar reivindicação: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setError('');
      setCurrentStep(currentStep - 1);
    }
  };

  // Auth check
  if (!user) {
    navigate('/auth', { state: { from: '/reivindicar-empresa' } });
    return null;
  }

  // Loading role
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin block
  if (isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Reivindicar Empresa | Comércio Vizinho</title>
        <meta name="description" content="Reivindique a administração da sua empresa no Comércio Vizinho" />
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
                  Siga os passos para solicitar a administração da sua empresa
                </CardDescription>
                <div className="pt-4">
                  <StepIndicator 
                    currentStep={currentStep} 
                    totalSteps={5} 
                    labels={STEP_LABELS} 
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* STEP 1: Document Input */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
                      <h3 className="font-semibold">Digite o documento da empresa</h3>
                      <p className="text-sm text-muted-foreground">
                        CNPJ (pessoa jurídica) ou CPF (negócio em nome de pessoa física)
                      </p>
                    </div>
                    
                    <DocumentInput
                      value={document}
                      onChange={setDocument}
                      required
                      autoLookup={false}
                      showLookupButton={false}
                      showCPFFields={true}
                      cpfData={cpfFormData}
                      onCPFDataChange={setCpfFormData}
                      onDocumentTypeChange={setDocumentType}
                    />

                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <Button 
                      onClick={handleDocumentAdvance}
                      disabled={loadingDocument || document.replace(/\D/g, '').length < 11}
                      className="w-full"
                    >
                      {loadingDocument ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {documentType === 'cpf' ? 'Avançar' : 'Consultar e Avançar'}
                    </Button>

                    {/* Manual fallback button when CNPJ lookup fails */}
                    {showManualFallback && documentType === 'cnpj' && (
                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="text-center bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                          <AlertCircle className="h-5 w-5 mx-auto text-amber-600 dark:text-amber-400 mb-2" />
                          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                            Não foi possível consultar o CNPJ automaticamente
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Você pode preencher os dados manualmente
                          </p>
                        </div>

                        <div className="space-y-3 bg-secondary/50 rounded-xl p-4">
                          <h4 className="font-medium text-sm">Preencher dados manualmente</h4>
                          
                          <div className="space-y-2">
                            <Label className="text-sm">Razão Social *</Label>
                            <Input
                              value={manualCnpjData.razaoSocial}
                              onChange={(e) => setManualCnpjData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                              placeholder="Nome da empresa conforme registro"
                              className="h-10"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Nome Fantasia</Label>
                            <Input
                              value={manualCnpjData.nomeFantasia}
                              onChange={(e) => setManualCnpjData(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                              placeholder="Nome popular da empresa"
                              className="h-10"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label className="text-sm">Cidade *</Label>
                              <Input
                                value={manualCnpjData.cidade}
                                onChange={(e) => setManualCnpjData(prev => ({ ...prev, cidade: e.target.value }))}
                                placeholder="Cidade"
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">UF</Label>
                              <Input
                                value={manualCnpjData.uf}
                                onChange={(e) => setManualCnpjData(prev => ({ ...prev, uf: e.target.value }))}
                                placeholder="MG"
                                maxLength={2}
                                className="h-10"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Endereço</Label>
                            <Input
                              value={manualCnpjData.endereco}
                              onChange={(e) => setManualCnpjData(prev => ({ ...prev, endereco: e.target.value }))}
                              placeholder="Rua, número, bairro"
                              className="h-10"
                            />
                          </div>
                        </div>

                        <Button 
                          onClick={handleManualCnpjAdvance}
                          variant="secondary"
                          className="w-full"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Continuar Manualmente
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: Document Data Confirmation */}
                {currentStep === 2 && documentData && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <CheckCircle className="h-8 w-8 mx-auto text-primary mb-2" />
                      <h3 className="font-semibold">
                        {documentData.documentType === 'cpf' ? 'Dados do CPF' : 'Dados do CNPJ'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Confira as informações
                      </p>
                    </div>

                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      {documentData.documentType === 'cnpj' ? (
                        <>
                          <div>
                            <Label className="text-xs text-muted-foreground">Razão Social</Label>
                            <p className="font-medium">{documentData.razaoSocial || '-'}</p>
                          </div>
                          {documentData.nomeFantasia && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Nome Fantasia</Label>
                              <p className="font-medium">{documentData.nomeFantasia}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-xs text-muted-foreground">Situação</Label>
                            <Badge 
                              variant={documentData.situacao === 'ATIVA' ? 'default' : 'destructive'}
                              className="mt-1"
                            >
                              {documentData.situacao}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Localização</Label>
                            <p className="font-medium">
                              {documentData.logradouro && `${documentData.logradouro}, ${documentData.numero} - `}
                              {documentData.bairro && `${documentData.bairro}, `}
                              {documentData.municipio} - {documentData.uf}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                            <p className="font-medium">{documentData.nomeCompleto || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Data de Nascimento</Label>
                            <p className="font-medium">
                              {documentData.dataNascimento 
                                ? new Date(documentData.dataNascimento).toLocaleDateString('pt-BR')
                                : '-'}
                            </p>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs text-amber-700 dark:text-amber-300">
                            🔒 CPF é um dado privado e não será exibido publicamente
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={goBack} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                      <Button onClick={handleConfirmDocumentData} className="flex-1">
                        Confirmar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Requester Data (PRIVATE) */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <User className="h-8 w-8 mx-auto text-primary mb-2" />
                      <h3 className="font-semibold">Seus Dados de Contato</h3>
                      <p className="text-sm text-muted-foreground">
                        Informações privadas (visíveis apenas para você e administradores)
                      </p>
                    </div>

                    <div className="bg-muted rounded-lg p-3 text-sm border border-muted-foreground/20">
                      <p className="text-foreground">
                        🔒 Esses dados são <strong>privados</strong> e nunca serão exibidos publicamente.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nome Completo *
                        </Label>
                        <Input
                          id="nome"
                          value={requesterData.nome}
                          onChange={(e) => setRequesterData(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Seu nome completo"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          WhatsApp Pessoal *
                        </Label>
                        <Input
                          id="whatsapp"
                          value={requesterData.whatsapp}
                          onChange={(e) => setRequesterData(prev => ({ ...prev, whatsapp: e.target.value }))}
                          placeholder="(11) 99999-9999"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          E-mail de Contato *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={requesterData.email}
                          onChange={(e) => setRequesterData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cargo" className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Cargo na Empresa *
                        </Label>
                        <Select
                          value={requesterData.cargo}
                          onValueChange={(value) => setRequesterData(prev => ({ ...prev, cargo: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="proprietario">Proprietário(a)</SelectItem>
                            <SelectItem value="socio">Sócio(a)</SelectItem>
                            <SelectItem value="gerente">Gerente</SelectItem>
                            <SelectItem value="representante">Representante Legal</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={goBack} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                      <Button onClick={handleRequesterAdvance} className="flex-1">
                        Avançar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Search and Select Establishment */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <Search className="h-8 w-8 mx-auto text-primary mb-2" />
                      <h3 className="font-semibold">Encontre sua Empresa</h3>
                      <p className="text-sm text-muted-foreground">
                        Busque e selecione a empresa que deseja reivindicar
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="searchTerm">Nome da Empresa</Label>
                        <Input
                          id="searchTerm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Digite o nome..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="searchCity">Cidade</Label>
                          <Input
                            id="searchCity"
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            placeholder="Cidade"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="searchCategory">Categoria</Label>
                          <Select value={searchCategory || 'todas'} onValueChange={(val) => setSearchCategory(val === 'todas' ? '' : val)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">Todas</SelectItem>
                              <SelectItem value="restaurante">Restaurante</SelectItem>
                              <SelectItem value="lanchonete">Lanchonete</SelectItem>
                              <SelectItem value="hamburgueria">Hamburgueria</SelectItem>
                              <SelectItem value="pizzaria">Pizzaria</SelectItem>
                              <SelectItem value="padaria">Padaria</SelectItem>
                              <SelectItem value="bar">Bar</SelectItem>
                              <SelectItem value="cafe">Café</SelectItem>
                              <SelectItem value="sorveteria">Sorveteria</SelectItem>
                              <SelectItem value="acai">Açaí</SelectItem>
                              <SelectItem value="supermercado">Supermercado</SelectItem>
                              <SelectItem value="hortifruti">Hortifruti</SelectItem>
                              <SelectItem value="açougue">Açougue</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button 
                        onClick={handleSearch} 
                        disabled={loadingSearch}
                        className="w-full"
                      >
                        {loadingSearch ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        Buscar Empresas
                      </Button>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    {establishments.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <Label className="text-sm font-medium">Resultados:</Label>
                        {establishments.map((est) => (
                          <button
                            key={est.id}
                            onClick={() => handleSelectEstablishment(est)}
                            className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <Building2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{est.name}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {est.address}
                                </p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {est.category}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <Button variant="outline" onClick={goBack} className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                  </div>
                )}

                {/* STEP 5: Review and Submit */}
                {currentStep === 5 && selectedEstablishment && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <h3 className="font-semibold">Confirmar Reivindicação</h3>
                      <p className="text-sm text-muted-foreground">
                        Revise os dados antes de enviar
                      </p>
                    </div>

                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Empresa Selecionada
                      </h4>
                      <p className="font-medium mt-2">{selectedEstablishment.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedEstablishment.address}</p>
                      <Badge variant="outline" className="mt-2">{selectedEstablishment.category}</Badge>
                    </div>

                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-sm">Seus Dados (Privados)</h4>
                      <p className="text-sm"><strong>Nome:</strong> {requesterData.nome}</p>
                      <p className="text-sm"><strong>WhatsApp:</strong> {requesterData.whatsapp}</p>
                      <p className="text-sm"><strong>E-mail:</strong> {requesterData.email}</p>
                      <p className="text-sm"><strong>Cargo:</strong> {requesterData.cargo}</p>
                    </div>

                    <div className="bg-muted rounded-lg p-3 text-sm border border-muted-foreground/20">
                      <p className="text-foreground">
                        ℹ️ Após enviar, nossa equipe analisará sua solicitação. Você receberá uma notificação com o resultado.
                      </p>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={goBack} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                      <Button 
                        onClick={handleSubmitClaim} 
                        disabled={submitting}
                        className="flex-1"
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Enviar Reivindicação
                      </Button>
                    </div>
                  </div>
                )}

                {/* Cancel button */}
                {currentStep === 1 && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/minha-empresa')} 
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
