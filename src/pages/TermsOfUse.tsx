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
            <CardTitle className="text-2xl">Termos e Responsabilidades</CardTitle>
            <p className="text-sm text-muted-foreground">Versão 1.0 — Atualizado em {new Date().toLocaleDateString('pt-BR')}</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Natureza da Plataforma</h3>
              <p className="text-muted-foreground">
                O <strong>Comércio Vizinho</strong> é uma plataforma digital de divulgação e localização de estabelecimentos 
                comerciais. Seu objetivo é conectar consumidores a empresas locais, facilitando a descoberta de 
                produtos e serviços próximos à localização do usuário.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>A plataforma NÃO intermedia pagamentos, transações financeiras, entregas de produtos 
                ou quaisquer negociações entre usuários e empresas.</strong> Toda e qualquer relação comercial 
                é feita diretamente entre as partes, sem participação ou responsabilidade do Comércio Vizinho.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Selos de Identificação</h3>
              <p className="text-muted-foreground">
                Para maior transparência, o Comércio Vizinho exibe selos de identificação nos estabelecimentos cadastrados:
              </p>
              <ul className="text-muted-foreground list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong>Cadastro com CNPJ (Pessoa Jurídica):</strong> Indica que a empresa apresentou um 
                  CNPJ válido no momento do cadastro. Este selo não constitui garantia de idoneidade, 
                  qualidade ou legalidade dos produtos e serviços oferecidos.
                </li>
                <li>
                  <strong>Pessoa Física — Sem Garantia:</strong> Indica que o cadastro foi realizado com CPF. 
                  A plataforma não realiza verificação de antecedentes, capacidade técnica ou qualquer 
                  avaliação sobre o cadastrante. O usuário deve exercer cautela redobrada ao negociar 
                  com estabelecimentos sob este selo.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. Limitação de Responsabilidade</h3>
              <p className="text-muted-foreground">
                O Comércio Vizinho <strong>NÃO se responsabiliza</strong> por:
              </p>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1 mt-2">
                <li>Qualidade, procedência ou segurança dos produtos e serviços anunciados</li>
                <li>Veracidade das informações fornecidas pelos estabelecimentos</li>
                <li>Cumprimento de prazos de entrega ou disponibilidade de produtos</li>
                <li>Negociações, acordos ou contratos firmados entre usuários e empresas</li>
                <li>Prejuízos financeiros decorrentes de transações realizadas fora da plataforma</li>
                <li>Problemas relacionados à entrega, devolução ou troca de produtos</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Responsabilidades do Usuário</h3>
              <p className="text-muted-foreground">
                O usuário é o único responsável por:
              </p>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1 mt-2">
                <li>Verificar a idoneidade do estabelecimento antes de realizar qualquer negociação</li>
                <li>Confirmar informações como preços, disponibilidade e condições de entrega diretamente com a empresa</li>
                <li>Utilizar a plataforma de forma ética e legal</li>
                <li>Fornecer informações verdadeiras ao se cadastrar</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Responsabilidades das Empresas Cadastradas</h3>
              <ul className="text-muted-foreground list-disc pl-5 space-y-1">
                <li>Manter informações atualizadas e verídicas (endereço, horários, contato, produtos)</li>
                <li>Não utilizar a plataforma para práticas enganosas, fraudulentas ou ilegais</li>
                <li>Responder diretamente aos consumidores sobre seus produtos e serviços</li>
                <li>Aguardar aprovação administrativa antes da publicação no catálogo</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Coleta de Dados</h3>
              <p className="text-muted-foreground">
                Coletamos dados básicos para funcionamento da plataforma, como localização 
                (quando autorizada), dados de cadastro de empresas e informações de contato. 
                Todos os dados são tratados conforme nossa{" "}
                <Link to="/politica-de-privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">7. Alterações nos Termos</h3>
              <p className="text-muted-foreground">
                Reservamos o direito de alterar estes termos a qualquer momento. As alterações 
                entrarão em vigor imediatamente após sua publicação na plataforma. O uso continuado 
                da plataforma após alterações implica aceitação dos novos termos.
              </p>
            </section>

            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 mt-6">
              <p className="text-sm font-medium text-destructive">
                ⚠️ Aviso importante: O Comércio Vizinho é exclusivamente uma plataforma de divulgação 
                e localização. Não nos responsabilizamos por nenhuma negociação, pagamento ou entrega 
                realizada entre usuários e estabelecimentos.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
