import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Store, TrendingUp, Users, BarChart3, Check, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function MerchantInfo() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Informações para Comerciantes
            </h1>
            <p className="text-xl text-muted-foreground">
              Leve seu negócio para mais pessoas e fortaleça sua presença local
            </p>
          </div>

          {/* Por que cadastrar */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">Por que cadastrar sua empresa?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <Users className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold">Alcance Mais Clientes</h3>
                  <p className="text-muted-foreground">
                    Seja encontrado por milhares de pessoas que buscam produtos e serviços 
                    no seu bairro todos os dias.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <TrendingUp className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold">Aumente suas Vendas</h3>
                  <p className="text-muted-foreground">
                    Divulgue seus produtos, promoções e horários de atendimento 
                    para atrair mais vendas.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <Store className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold">Presença Digital</h3>
                  <p className="text-muted-foreground">
                    Tenha uma página profissional para seu negócio sem precisar 
                    criar site ou app próprio.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <BarChart3 className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold">Estatísticas</h3>
                  <p className="text-muted-foreground">
                    Acompanhe visualizações do seu perfil e cliques no WhatsApp 
                    para entender melhor seu público.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* O que oferecemos */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">O que sua empresa ganha</h2>
            <Card className="shadow-card">
              <CardContent className="p-6">
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Página exclusiva</strong>
                      <p className="text-muted-foreground">
                        Seu estabelecimento terá uma página completa com todas as informações, 
                        fotos e contatos.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Apareça nas buscas</strong>
                      <p className="text-muted-foreground">
                        Quando alguém buscar pela sua categoria ou bairro, seu negócio aparecerá 
                        nos resultados.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Contato direto</strong>
                      <p className="text-muted-foreground">
                        Botões de WhatsApp e telefone para seus clientes entrarem em contato 
                        facilmente.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Galeria de produtos</strong>
                      <p className="text-muted-foreground">
                        Mostre seus produtos ou serviços com fotos, descrições e preços.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Horário de funcionamento</strong>
                      <p className="text-muted-foreground">
                        Mostre quando está aberto com indicador visual "Aberto agora".
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Compartilhamento fácil</strong>
                      <p className="text-muted-foreground">
                        Seus clientes podem compartilhar sua empresa com amigos pelo WhatsApp.
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Como funciona */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">Como cadastrar seu negócio</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Preencha o formulário</h3>
                  <p className="text-muted-foreground">
                    Envie as informações do seu estabelecimento através do nosso formulário de cadastro. 
                    É rápido e gratuito!
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Análise da equipe</h3>
                  <p className="text-muted-foreground">
                    Nossa equipe irá verificar as informações e preparar a página do seu estabelecimento. 
                    Isso geralmente leva até 24 horas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Seu negócio no ar!</h3>
                  <p className="text-muted-foreground">
                    Assim que aprovado, sua empresa já estará visível na plataforma e disponível 
                    para milhares de pessoas encontrarem.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Atualizações</h3>
                  <p className="text-muted-foreground">
                    Precisa atualizar informações? Entre em contato conosco pelo WhatsApp 
                    que faremos as alterações necessárias.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Planos */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">Planos disponíveis</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-2xl font-bold">Plano Básico</h3>
                  <p className="text-3xl font-bold text-primary">Grátis</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      Página completa do estabelecimento
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      Aparece nas buscas
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      Botões de contato
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      Galeria de produtos
                    </li>
                  </ul>
                  <Link to="/cadastrar">
                    <Button className="w-full" variant="outline">
                      Cadastrar Grátis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="shadow-elevated border-2 border-primary">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold">Plano Premium</h3>
                    <span className="px-2 py-1 text-xs font-bold bg-primary text-primary-foreground rounded">
                      DESTAQUE
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-primary">Sob consulta</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      Tudo do Plano Básico
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      Aparece no banner principal
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      Selo de destaque
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      Prioridade nas buscas
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      Estatísticas detalhadas
                    </li>
                  </ul>
                  <a href="https://wa.me/5531999999999" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full">
                      <Rocket className="mr-2 h-4 w-4" />
                      Falar sobre Premium
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center space-y-6 py-12">
            <h2 className="text-3xl font-bold">Pronto para começar?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cadastre seu estabelecimento agora e comece a atrair mais clientes hoje mesmo!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastrar">
                <Button size="lg" className="w-full sm:w-auto">
                  Cadastrar Meu Negócio
                </Button>
              </Link>
              <a href="https://wa.me/5531999999999" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Tirar Dúvidas
                </Button>
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}