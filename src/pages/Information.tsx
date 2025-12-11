import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function Information() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Comércio Vizinho" className="h-20 w-20 mb-4" />
            <h1 className="text-2xl font-bold text-center">Comércio Vizinho</h1>
            <p className="text-muted-foreground text-center mt-2">
              Informações institucionais e documentos legais
            </p>
          </div>

          <div className="space-y-4">
            <Link to="/sobre">
              <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 py-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Info className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Sobre o App</CardTitle>
                    <CardDescription>
                      Conheça o Comércio Vizinho e nossa missão
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>

            <Link to="/termos-de-uso">
              <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 py-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Termos de Uso</CardTitle>
                    <CardDescription>
                      Regras e condições de uso da plataforma
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>

            <Link to="/politica-de-privacidade">
              <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 py-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Política de Privacidade</CardTitle>
                    <CardDescription>
                      Como tratamos seus dados pessoais
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-secondary/30 text-center">
            <p className="text-sm text-muted-foreground">
              Dúvidas? Entre em contato pelo e-mail{" "}
              <a href="mailto:contato@comerciovizinho.com" className="text-primary hover:underline">
                contato@comerciovizinho.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
