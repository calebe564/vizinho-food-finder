import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, MapPin, TrendingUp } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center">Sobre o Comércio Vizinho</h1>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Conectando você aos melhores estabelecimentos do seu bairro
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <p>
              O <strong>Comércio Vizinho</strong> nasceu com o objetivo de fortalecer a economia local 
              e facilitar a vida de quem busca produtos e serviços próximos de casa. Acreditamos que 
              o comércio de bairro é essencial para criar comunidades mais fortes e conectadas.
            </p>

            <p>
              Nossa plataforma reúne estabelecimentos locais de diversas categorias, permitindo que 
              você descubra novos lugares, encontre o que precisa perto de você e apoie os negócios 
              da sua região.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Apoio ao Comércio Local</h3>
                    <p className="text-muted-foreground">
                      Fortalecemos a economia do bairro conectando consumidores aos 
                      estabelecimentos locais.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Comunidade Conectada</h3>
                    <p className="text-muted-foreground">
                      Criamos laços mais fortes entre vizinhos e comerciantes da região.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Facilidade e Praticidade</h3>
                    <p className="text-muted-foreground">
                      Encontre rapidamente o que você precisa perto de casa, sem complicação.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Crescimento Sustentável</h3>
                    <p className="text-muted-foreground">
                      Ajudamos pequenos negócios a crescerem e se destacarem na região.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Faça Parte do Comércio Vizinho</h2>
              <p className="text-muted-foreground mb-6">
                Tem um estabelecimento e quer aparecer na plataforma? Entre em contato conosco!
              </p>
              <a
                href="https://wa.me/5531999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 rounded-md font-medium transition-colors">
                  Falar com a Gente
                </button>
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
