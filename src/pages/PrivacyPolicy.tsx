import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, Eye, Lock, Cookie, Database, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-4">
            <Shield className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-4xl font-bold">Política de Privacidade</h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Introdução */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Introdução</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Comércio Vizinho respeita sua privacidade e está comprometido em proteger 
              seus dados pessoais. Esta Política de Privacidade explica como coletamos, 
              usamos e protegemos suas informações quando você utiliza nossa plataforma.
            </p>
          </section>

          {/* Dados que coletamos */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Dados que coletamos</h2>
            
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Eye className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Navegação pública</h3>
                    <p className="text-muted-foreground">
                      <strong>Não coletamos dados pessoais</strong> de usuários que apenas navegam 
                      pela plataforma. Você pode buscar e visualizar estabelecimentos de forma 
                      completamente anônima, sem necessidade de cadastro ou login.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Database className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Formulário de cadastro</h3>
                    <p className="text-muted-foreground mb-3">
                      Quando você envia uma solicitação de cadastro de estabelecimento, 
                      coletamos apenas as seguintes informações:
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Nome do estabelecimento</li>
                      <li>• Endereço comercial</li>
                      <li>• Telefone comercial</li>
                      <li>• WhatsApp comercial (opcional)</li>
                      <li>• Categoria do negócio</li>
                      <li>• Descrição do estabelecimento</li>
                    </ul>
                    <p className="text-muted-foreground mt-3">
                      Estes dados são usados exclusivamente para criar e exibir a página 
                      do estabelecimento na plataforma.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Cookie className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Cookies e rastreamento</h3>
                    <p className="text-muted-foreground">
                      <strong>Não utilizamos cookies de rastreamento ou publicidade.</strong> 
                      Utilizamos apenas cookies técnicos essenciais para o funcionamento da 
                      plataforma, como preferência de tema (claro/escuro) armazenada localmente 
                      no seu navegador.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Como usamos os dados */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Como usamos seus dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os dados coletados são usados exclusivamente para:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Criar e exibir páginas de estabelecimentos na plataforma
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Permitir que clientes encontrem e entrem em contato com estabelecimentos
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Melhorar a experiência de uso da plataforma
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Comunicar atualizações importantes sobre o serviço (apenas para estabelecimentos cadastrados)
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              <strong>Nunca vendemos, alugamos ou compartilhamos seus dados com terceiros 
              para fins de marketing ou publicidade.</strong>
            </p>
          </section>

          {/* Segurança */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Segurança dos dados</h2>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Lock className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Proteção</h3>
                    <p className="text-muted-foreground">
                      Implementamos medidas de segurança técnicas e organizacionais apropriadas 
                      para proteger seus dados contra acesso não autorizado, alteração, divulgação 
                      ou destruição. Isso inclui:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mt-3">
                      <li>• Criptografia de dados em trânsito (HTTPS)</li>
                      <li>• Armazenamento seguro em servidores protegidos</li>
                      <li>• Acesso restrito às informações apenas para equipe autorizada</li>
                      <li>• Monitoramento regular de segurança</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Seus direitos */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Seus direitos (LGPD)</h2>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <UserCheck className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground mb-3">
                      De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os 
                      seguintes direitos:
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <strong>Acesso:</strong> Você pode solicitar uma cópia dos dados que temos sobre seu estabelecimento
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <strong>Correção:</strong> Você pode solicitar a correção de dados incorretos ou desatualizados
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <strong>Exclusão:</strong> Você pode solicitar a exclusão dos seus dados e da página do estabelecimento
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <strong>Portabilidade:</strong> Você pode solicitar seus dados em formato estruturado
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <strong>Revogação:</strong> Você pode revogar o consentimento a qualquer momento
                      </li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      Para exercer qualquer um destes direitos, entre em contato conosco através 
                      do WhatsApp ou e-mail disponíveis no rodapé.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Retenção de dados */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Retenção de dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos os dados dos estabelecimentos enquanto a página estiver ativa na 
              plataforma. Se você solicitar a remoção do seu estabelecimento, excluiremos 
              todos os dados associados em até 30 dias.
            </p>
          </section>

          {/* Alterações */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Alterações nesta política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade ocasionalmente para refletir 
              mudanças em nossas práticas ou por outros motivos operacionais, legais ou 
              regulatórios. Notificaremos sobre alterações significativas através de um 
              aviso na plataforma ou por e-mail (para estabelecimentos cadastrados).
            </p>
          </section>

          {/* Contato */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como 
              tratamos seus dados, entre em contato conosco:
            </p>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>E-mail:</strong> contato@comerciovizinho.com</li>
                  <li><strong>WhatsApp:</strong> (31) 99999-9999</li>
                  <li><strong>Endereço:</strong> Belo Horizonte, MG</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Consentimento */}
          <section className="bg-muted p-6 rounded-lg">
            <p className="text-muted-foreground text-center">
              Ao utilizar o Comércio Vizinho, você concorda com esta Política de Privacidade 
              e com o processamento dos seus dados conforme descrito acima.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}