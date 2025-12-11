import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
            <CardTitle className="text-2xl">Política de Privacidade</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Quais Dados Coletamos</h3>
              <p className="text-muted-foreground mb-2">
                Para oferecer uma experiência personalizada, coletamos:
              </p>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                <li><strong>Localização:</strong> Quando autorizada, para mostrar estabelecimentos próximos</li>
                <li><strong>Dados de Cadastro:</strong> Nome, endereço, telefone e categoria das empresas</li>
                <li><strong>Informações de Contato:</strong> E-mail para comunicações administrativas</li>
                <li><strong>Dados de Navegação:</strong> Páginas visitadas para melhorar a experiência</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Como Armazenamos os Dados</h3>
              <p className="text-muted-foreground">
                Todos os dados são armazenados de forma segura em servidores protegidos, 
                utilizando criptografia e práticas modernas de segurança. Mantemos backups 
                regulares e controles de acesso rigorosos para proteger suas informações.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. Como Usamos os Dados</h3>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                <li>Exibir estabelecimentos relevantes baseados na sua localização</li>
                <li>Permitir que empresas mantenham seus cadastros atualizados</li>
                <li>Melhorar a experiência de navegação na plataforma</li>
                <li>Enviar comunicações importantes sobre o serviço</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Compartilhamento de Dados</h3>
              <p className="text-muted-foreground">
                Não vendemos ou compartilhamos seus dados pessoais com terceiros para 
                fins de marketing. As informações das empresas são públicas por natureza 
                do serviço (catálogo de estabelecimentos).
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Seus Direitos</h3>
              <p className="text-muted-foreground mb-2">
                Você tem o direito de:
              </p>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                <li>Acessar os dados que temos sobre você</li>
                <li>Solicitar correção de dados incorretos</li>
                <li>Solicitar a exclusão dos seus dados</li>
                <li>Revogar o consentimento de uso de localização</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Solicitação de Remoção</h3>
              <p className="text-muted-foreground">
                Para solicitar a remoção dos seus dados, entre em contato conosco através 
                do e-mail <strong>contato@comerciovizinho.com</strong> ou via WhatsApp. 
                Processaremos sua solicitação em até 15 dias úteis.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">7. Cookies e Tecnologias</h3>
              <p className="text-muted-foreground">
                Utilizamos cookies e tecnologias similares para lembrar suas preferências, 
                como tema claro/escuro e localização selecionada, melhorando sua experiência 
                de navegação.
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
