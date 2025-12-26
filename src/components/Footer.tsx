import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Sobre */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Comércio Vizinho" className="h-12 w-12" />
              <span className="font-bold text-xl">Comércio Vizinho</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Conectando você aos melhores estabelecimentos do seu bairro. 
              Descubra comércios locais, apoie a economia da sua região e 
              encontre tudo o que precisa perto de você.
            </p>
            <div className="flex gap-4">
              <a
                href="https://wa.me/5531999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href="mailto:contato@comerciovizinho.com"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/categorias" className="text-muted-foreground hover:text-primary transition-colors">
                  Categorias
                </Link>
              </li>
              <li>
                <Link to="/estabelecimentos" className="text-muted-foreground hover:text-primary transition-colors">
                  Todas as Empresas
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-muted-foreground hover:text-primary transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/termos-de-uso" className="text-muted-foreground hover:text-primary transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/politica-de-privacidade" className="text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Empresas */}
          <div>
            <h3 className="font-semibold mb-4">Para Empresas</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/cadastrar" className="text-muted-foreground hover:text-primary transition-colors">
                  Cadastrar Empresa
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {currentYear} Comércio Vizinho. Todos os direitos reservados.</p>
          <p className="mt-2">
            Desenvolvido para fortalecer o comércio local e conectar comunidades.
          </p>
        </div>
      </div>
    </footer>
  );
}
