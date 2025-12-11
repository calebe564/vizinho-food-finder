import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TermsOfUse() {
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
            <CardTitle className="text-2xl">Termos de Uso</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Finalidade do Aplicativo</h3>
              <p className="text-muted-foreground">
                O Comércio Vizinho é uma plataforma digital que conecta consumidores a estabelecimentos 
                comerciais locais. Nosso objetivo é fortalecer o comércio de bairro, facilitando a 
                descoberta de produtos e serviços próximos à sua localização.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Regras para Clientes</h3>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                <li>Utilizar a plataforma de forma respeitosa e ética</li>
                <li>Fornecer informações verdadeiras quando necessário</li>
                <li>Não utilizar o aplicativo para fins ilícitos ou fraudulentos</li>
                <li>Respeitar os estabelecimentos e seus funcionários</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. Regras para Empresas</h3>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                <li>Cadastrar apenas informações verdadeiras e atualizadas</li>
                <li>Manter os dados de contato e horários sempre corretos</li>
                <li>Não utilizar a plataforma para práticas enganosas</li>
                <li>Aguardar a aprovação do administrador para publicação</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Coleta de Dados</h3>
              <p className="text-muted-foreground">
                Coletamos dados básicos para funcionamento da plataforma, como localização 
                (quando autorizada), dados de cadastro de empresas e informações de contato. 
                Todos os dados são tratados conforme nossa Política de Privacidade.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Responsabilidades</h3>
              <p className="text-muted-foreground">
                O Comércio Vizinho atua como intermediário entre clientes e estabelecimentos, 
                não sendo responsável por transações comerciais realizadas diretamente entre 
                as partes. Os preços e disponibilidade de produtos são de responsabilidade 
                exclusiva dos estabelecimentos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Alterações nos Termos</h3>
              <p className="text-muted-foreground">
                Reservamos o direito de alterar estes termos a qualquer momento, sendo que 
                as alterações entrarão em vigor imediatamente após sua publicação na plataforma.
              </p>
            </section>

            <p className="text-sm text-muted-foreground pt-4 border-t">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
