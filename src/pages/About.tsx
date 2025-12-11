import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Store, Users, Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/informacoes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Sobre o Comércio Vizinho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold mb-3">O que é o Comércio Vizinho?</h3>
              <p className="text-muted-foreground">
                O Comércio Vizinho é uma plataforma digital criada para conectar você aos 
                melhores estabelecimentos comerciais do seu bairro. Acreditamos no poder 
                do comércio local e na importância de fortalecer a economia das comunidades.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <Store className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Para Comerciantes</h4>
                <p className="text-sm text-muted-foreground">
                  Uma vitrine digital gratuita para divulgar seu estabelecimento, 
                  produtos e serviços para toda a vizinhança.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <Users className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Para Clientes</h4>
                <p className="text-sm text-muted-foreground">
                  Encontre facilmente o que precisa perto de você, descubra novos 
                  estabelecimentos e apoie o comércio do seu bairro.
                </p>
              </div>
            </div>

            <section>
              <h3 className="text-lg font-semibold mb-3">Nosso Objetivo</h3>
              <div className="flex gap-4 items-start">
                <Heart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-muted-foreground">
                  Fortalecer o comércio local, criar conexões entre vizinhos e comerciantes, 
                  e contribuir para uma comunidade mais unida e próspera. Queremos que você 
                  encontre tudo o que precisa sem sair do seu bairro.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">Como Funciona</h3>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Busque por categoria ou localização</h4>
                    <p className="text-sm text-muted-foreground">
                      Use a busca para encontrar restaurantes, padarias, mercados e muito mais.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Descubra estabelecimentos próximos</h4>
                    <p className="text-sm text-muted-foreground">
                      Veja os comércios mais perto de você, com informações completas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Entre em contato diretamente</h4>
                    <p className="text-sm text-muted-foreground">
                      Ligue, envie WhatsApp ou visite o estabelecimento pessoalmente.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="p-4 rounded-xl bg-primary/10 flex gap-4 items-center">
              <MapPin className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold">Foco Regional</h4>
                <p className="text-sm text-muted-foreground">
                  Atualmente focamos na região do Barreiro, em Belo Horizonte, 
                  mas nosso sonho é expandir para todas as comunidades.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
