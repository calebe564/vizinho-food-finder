import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Search, MapPin, Star, Shield, Clock, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ClientInfo() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Informações para Clientes
            </h1>
            <p className="text-xl text-muted-foreground">
              Descubra como aproveitar ao máximo o Comércio Vizinho
            </p>
          </div>

          {/* Benefícios */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">Por que usar o Comércio Vizinho?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <Search className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold">Encontre Fácil</h3>
                  <p className="text-muted-foreground">
                    Busque por categoria, bairro ou nome. Encontre exatamente o que precisa 
                    perto de você em segundos.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <MapPin className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold">Comércio Local</h3>
                  <p className="text-muted-foreground">
                    Apoie os negócios do seu bairro. Fortaleça a economia local e 
                    construa uma comunidade mais unida.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <Star className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold">Empresas Verificadas</h3>
                  <p className="text-muted-foreground">
                    Todos os estabelecimentos são verificados para garantir 
                    informações atualizadas e confiáveis.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <Clock className="h-10 w-10 text-primary" />
                  <h3 className="text-xl font-semibold">Horários Atualizados</h3>
                  <p className="text-muted-foreground">
                    Veja os horários de funcionamento e saiba se o estabelecimento 
                    está aberto agora mesmo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Como Usar */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">Como usar a plataforma</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Busque o que precisa</h3>
                  <p className="text-muted-foreground">
                    Use a barra de busca na página inicial ou navegue por categorias e bairros 
                    para encontrar estabelecimentos específicos.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Veja os detalhes</h3>
                  <p className="text-muted-foreground">
                    Clique no estabelecimento para ver endereço completo, horários, 
                    telefone, produtos/serviços e muito mais.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Entre em contato</h3>
                  <p className="text-muted-foreground">
                    Use os botões de WhatsApp ou telefone para entrar em contato direto 
                    com o estabelecimento e fazer pedidos ou tirar dúvidas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Compartilhe</h3>
                  <p className="text-muted-foreground">
                    Encontrou algo legal? Compartilhe com amigos e familiares pelo WhatsApp 
                    usando o botão de compartilhamento.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Privacidade */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">Sua Privacidade</h2>
            <Card className="shadow-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Shield className="h-10 w-10 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Dados Seguros</h3>
                    <p className="text-muted-foreground">
                      Não coletamos dados pessoais para navegação. Você pode usar a plataforma 
                      livremente sem necessidade de cadastro ou login.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Heart className="h-10 w-10 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Sem Rastreamento</h3>
                    <p className="text-muted-foreground">
                      Não usamos cookies de rastreamento ou anúncios invasivos. 
                      Nossa missão é conectar você ao comércio local, não coletar seus dados.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Dicas */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">Dicas para aproveitar melhor</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Use os filtros por categoria para encontrar rapidamente o tipo de estabelecimento que procura
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Verifique sempre os horários de funcionamento antes de ir
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Salve seus estabelecimentos favoritos nos favoritos do navegador
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Instale o app na sua tela inicial para acesso rápido (PWA)
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                Ajude outros usuários: sugira novos estabelecimentos através do formulário de cadastro
              </li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}