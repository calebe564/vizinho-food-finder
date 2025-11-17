import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-4">
            <FileText className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-4xl font-bold">Termos de Uso</h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Introdução */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bem-vindo ao Comércio Vizinho. Ao acessar e usar esta plataforma, você concorda 
              em cumprir e estar vinculado aos seguintes Termos de Uso. Se você não concordar 
              com qualquer parte destes termos, não deverá usar nosso serviço.
            </p>
          </section>

          {/* Definições */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">2. Definições</h2>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">"Plataforma":</strong> Refere-se ao 
                    website e aplicativo Comércio Vizinho
                  </li>
                  <li>
                    <strong className="text-foreground">"Usuário":</strong> Qualquer pessoa 
                    que acessa e navega pela plataforma
                  </li>
                  <li>
                    <strong className="text-foreground">"Estabelecimento":</strong> Empresas, 
                    comércios ou prestadores de serviços cadastrados na plataforma
                  </li>
                  <li>
                    <strong className="text-foreground">"Conteúdo":</strong> Todas as informações, 
                    textos, imagens e dados exibidos na plataforma
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Uso da plataforma */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">3. Uso da Plataforma</h2>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                Usos Permitidos
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-8">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  Buscar e visualizar informações sobre estabelecimentos
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  Entrar em contato com estabelecimentos através dos dados fornecidos
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  Compartilhar páginas de estabelecimentos com outras pessoas
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  Sugerir novos estabelecimentos através do formulário de cadastro
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  Usar a plataforma para fins pessoais e não comerciais
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <XCircle className="h-6 w-6 text-destructive" />
                Usos Proibidos
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-8">
                <li className="flex gap-2">
                  <span className="text-destructive font-bold">•</span>
                  Usar a plataforma para qualquer finalidade ilegal ou não autorizada
                </li>
                <li className="flex gap-2">
                  <span className="text-destructive font-bold">•</span>
                  Copiar, reproduzir ou redistribuir o conteúdo da plataforma sem autorização
                </li>
                <li className="flex gap-2">
                  <span className="text-destructive font-bold">•</span>
                  Enviar informações falsas, enganosas ou difamatórias sobre estabelecimentos
                </li>
                <li className="flex gap-2">
                  <span className="text-destructive font-bold">•</span>
                  Tentar acessar áreas restritas ou comprometer a segurança da plataforma
                </li>
                <li className="flex gap-2">
                  <span className="text-destructive font-bold">•</span>
                  Usar bots, scrapers ou outras ferramentas automatizadas sem permissão
                </li>
                <li className="flex gap-2">
                  <span className="text-destructive font-bold">•</span>
                  Assediar, ameaçar ou prejudicar outros usuários ou estabelecimentos
                </li>
              </ul>
            </div>
          </section>

          {/* Cadastro de estabelecimentos */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">4. Cadastro de Estabelecimentos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao solicitar o cadastro de um estabelecimento, você declara que:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Todas as informações fornecidas são verdadeiras e precisas
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Você tem autorização para cadastrar o estabelecimento
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                O estabelecimento possui CNPJ válido ou alvará de funcionamento
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Você se compromete a manter as informações atualizadas
              </li>
            </ul>
            <Card className="shadow-card mt-4">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Importante:</strong> O Comércio Vizinho 
                    reserva-se o direito de recusar, remover ou desativar qualquer cadastro que 
                    viole estes termos ou que contenha informações inadequadas, falsas ou enganosas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Propriedade intelectual */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">5. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo da plataforma, incluindo mas não limitado a textos, gráficos, 
              logotipos, ícones, imagens, áudio, vídeo e software, é de propriedade do 
              Comércio Vizinho ou de seus fornecedores de conteúdo e é protegido pelas 
              leis de direitos autorais brasileiras e internacionais.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              As informações sobre estabelecimentos (nome, endereço, telefone, etc.) são 
              de propriedade dos respectivos estabelecimentos e são exibidas na plataforma 
              com o propósito de divulgação.
            </p>
          </section>

          {/* Responsabilidades */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">6. Responsabilidades e Isenções</h2>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">6.1 Informações dos Estabelecimentos</h3>
                  <p className="text-muted-foreground">
                    O Comércio Vizinho atua como intermediário na divulgação de informações 
                    sobre estabelecimentos. Não nos responsabilizamos por:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mt-2 ml-4">
                    <li>• Qualidade dos produtos ou serviços oferecidos pelos estabelecimentos</li>
                    <li>• Precisão, completude ou atualização das informações fornecidas</li>
                    <li>• Práticas comerciais, preços ou políticas dos estabelecimentos</li>
                    <li>• Disputas entre usuários e estabelecimentos</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">6.2 Disponibilidade do Serviço</h3>
                  <p className="text-muted-foreground">
                    Embora nos esforcemos para manter a plataforma sempre disponível, não 
                    garantimos que o serviço estará ininterrupto, seguro ou livre de erros. 
                    Podemos suspender temporariamente o acesso para manutenção ou atualizações.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">6.3 Links Externos</h3>
                  <p className="text-muted-foreground">
                    A plataforma pode conter links para websites externos (como Instagram ou 
                    sites de estabelecimentos). Não somos responsáveis pelo conteúdo ou práticas 
                    de privacidade desses sites.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Modificações */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">7. Modificações dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. 
              As alterações entrarão em vigor imediatamente após sua publicação na plataforma. 
              É sua responsabilidade revisar periodicamente estes termos. O uso continuado da 
              plataforma após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          {/* Rescisão */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">8. Rescisão</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos encerrar ou suspender o acesso à plataforma imediatamente, sem aviso 
              prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se 
              você violar os Termos de Uso. Todas as disposições destes Termos que, por sua 
              natureza, devam sobreviver à rescisão, sobreviverão, incluindo, mas não se 
              limitando a, disposições de propriedade, isenções de garantia e limitações de 
              responsabilidade.
            </p>
          </section>

          {/* Lei aplicável */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">9. Lei Aplicável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, 
              especialmente a Lei Geral de Proteção de Dados (LGPD) e o Marco Civil da Internet. 
              Qualquer disputa relacionada a estes termos será submetida à jurisdição exclusiva 
              dos tribunais de Belo Horizonte, Minas Gerais.
            </p>
          </section>

          {/* Contato */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">10. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:
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

          {/* Aceitação */}
          <section className="bg-muted p-6 rounded-lg">
            <p className="text-muted-foreground text-center">
              Ao utilizar o Comércio Vizinho, você reconhece que leu, compreendeu e concorda 
              em estar vinculado a estes Termos de Uso.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}