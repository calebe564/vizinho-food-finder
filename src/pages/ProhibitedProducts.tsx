import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PROHIBITED = [
  "Drogas ilícitas.",
  "Armas e munições.",
  "Produtos falsificados.",
  "Produtos roubados.",
  "Medicamentos comercializados de forma irregular.",
  "Produtos proibidos pela legislação aplicável.",
  "Outros itens que representem risco ou violem a legislação.",
];

export default function ProhibitedProducts() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Política de produtos proibidos | Comércio Vizinho</title>
        <meta name="description" content="O que não pode ser divulgado no Comércio Vizinho e como denunciar." />
      </Helmet>
      <Header />
      <main className="flex-1 container px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/informacoes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Política de produtos proibidos</CardTitle>
            <p className="text-sm text-muted-foreground">Vale para todos os estabelecimentos e produtos divulgados na plataforma.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-2">O que não pode ser divulgado</h2>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {PROHIBITED.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">O que pode acontecer</h2>
              <p className="text-muted-foreground">
                A equipe pode pedir esclarecimentos, remover anúncios e produtos e suspender estabelecimentos. Ter CPF ou CNPJ
                cadastrado não comprova, por si só, que tudo o que é vendido é legal: cada caso suspeito é analisado por uma pessoa.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">Como denunciar</h2>
              <p className="text-muted-foreground">
                Na página de qualquer empresa ou produto, abra o menu (os três pontos) e escolha <strong>Denunciar</strong>. Você pode
                denunciar com ou sem conta, e informar um contato apenas se quiser retorno. Registramos cada denúncia e o que foi decidido.
              </p>
            </section>

            <p className="text-xs text-muted-foreground">
              O Comércio Vizinho é uma plataforma de divulgação e não intermedia pagamentos, entregas ou negociações.{" "}
              <Link to="/termos-de-uso" className="text-primary hover:underline">
                Termos e Responsabilidades
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
