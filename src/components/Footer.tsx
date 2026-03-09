import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container px-3 md:px-4 py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Logo e Sobre */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-1.5 mb-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-bold text-base">Comércio Vizinho</span>
            </Link>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 max-w-sm leading-relaxed">
              Conectando você aos melhores estabelecimentos do seu bairro. 
              Descubra comércios locais e apoie a economia da sua região.
            </p>
            <div className="flex gap-3">
              <a
                href="https://wa.me/5531999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="mailto:contato@comerciovizinho.com"
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-foreground/70 hover:text-primary transition-colors text-xs md:text-sm">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/categorias" className="text-foreground/70 hover:text-primary transition-colors text-xs md:text-sm">
                  Categorias
                </Link>
              </li>
              <li>
                <Link to="/estabelecimentos" className="text-foreground/70 hover:text-primary transition-colors text-xs md:text-sm">
                  Empresas
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-foreground/70 hover:text-primary transition-colors text-xs md:text-sm">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/termos-de-uso" className="text-foreground/70 hover:text-primary transition-colors text-xs md:text-sm">
                  Termos
                </Link>
              </li>
              <li>
                <Link to="/politica-de-privacidade" className="text-foreground/70 hover:text-primary transition-colors text-xs md:text-sm">
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Empresas */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Empresas</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/cadastrar" className="text-foreground/70 hover:text-primary transition-colors text-xs md:text-sm">
                  Cadastrar
                </Link>
              </li>
              <li>
                <Link to="/reivindicar-empresa" className="text-foreground/70 hover:text-primary transition-colors text-xs md:text-sm">
                  Reivindicar
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border mt-6 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Comércio Vizinho · Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
