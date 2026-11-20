import { Link, NavLink, useNavigate } from "react-router-dom";
import { Briefcase, Crown, ExternalLink, LogOut, MapPin, MessageSquare } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadConversations } from "@/hooks/useUnreadConversations";
import { MERCHANT_BASE, MERCHANT_HOME } from "@/config/areas";

const NAV = [
  { to: MERCHANT_HOME, label: "Minha empresa", icon: Briefcase },
  { to: `${MERCHANT_BASE}/planos`, label: "Planos", icon: Crown },
  { to: "/suporte", label: "Suporte", icon: MessageSquare },
] as const;

/** Cabeçalho da área do comerciante (/painel): só ferramentas da empresa, sem a vitrine do consumidor. */
export function MerchantHeader() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadConversations();

  const initial = profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
        <Link to={MERCHANT_HOME} className="flex items-center gap-1.5 hover:opacity-90 transition-opacity" aria-label="Painel do comerciante">
          <MapPin className="h-5 w-5 md:h-6 md:w-6 text-primary" aria-hidden="true" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm md:text-base text-primary tracking-tight">Comércio Vizinho</span>
            <span className="text-[10px] md:text-xs text-muted-foreground -mt-0.5">Painel do comerciante</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5" aria-label="Painel do comerciante">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
              {to === "/suporte" && unreadCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 md:gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex rounded-full gap-1.5 h-9 text-xs">
            <Link to="/">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Ver como cliente
            </Link>
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0" aria-label="Menu da conta">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">{initial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover shadow-elevated rounded-xl">
              <div className="px-3 py-2">
                <p className="text-sm font-medium truncate">{profile?.full_name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="sm:hidden">
                <Link to="/" className="flex items-center gap-2 cursor-pointer">
                  <ExternalLink className="h-4 w-4" />
                  Ver como cliente
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Celular: o menu do painel fica numa faixa rolável abaixo do cabeçalho */}
      <nav className="md:hidden border-t border-border overflow-x-auto" aria-label="Painel do comerciante">
        <div className="container flex items-center gap-1 px-3 py-1.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
              {to === "/suporte" && unreadCount > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
