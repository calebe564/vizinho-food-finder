import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Building2, Store, Menu, Heart, LogIn, LogOut, User, Briefcase, UserPlus, X, MoreVertical, MessageSquare, ClipboardCheck, Bot, Crown, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAccess } from "@/hooks/useAccess";
import { consumerMenuEntries, isMerchantPath, type MenuEntryId } from "@/config/areas";
import { MerchantHeader } from "./MerchantHeader";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useUnreadConversations } from "@/hooks/useUnreadConversations";
import { AIChatSheet } from "./AIChatSheet";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { BrandLogo } from "./BrandLogo";

const ENTRY_ICONS: Record<MenuEntryId, typeof Briefcase> = {
  cadastrar: UserPlus,
  reivindicar: ClipboardCheck,
  painel: Briefcase,
  suporte: MessageSquare,
  admin: ShieldCheck,
};

/** Na área do comerciante (/painel) o cabeçalho é outro; no resto do site, o do consumidor. */
export function Header() {
  const { pathname } = useLocation();
  return isMerchantPath(pathname) ? <MerchantHeader /> : <ConsumerHeader />;
}

function ConsumerHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { totalFavorites } = useFavorites();
  const { user, profile, signOut, isAdmin } = useAuth();
  const { profile: accessProfile } = useAccess();
  const navigate = useNavigate();
  const hasFavorites = totalFavorites > 0;

  // Itens do menu: um só lugar para computador e celular (nada de comerciante/admin vaza para o consumidor)
  const menuEntries = consumerMenuEntries(accessProfile, !!user);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  const { unreadCount } = useUnreadConversations();
  const { counts: adminNotifCounts } = useAdminNotifications();
  
  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/buscar", label: "Bússola" },
    { to: "/estabelecimentos", label: "Empresas" },
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
        {/* Logo */}
        <Link to="/informacoes" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <BrandLogo size="md" />
        </Link>

        {/* Desktop Navigation - Clean horizontal */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 md:gap-2">
          <ThemeToggle />
          
          {/* Favorites - Desktop */}
          <Link to="/favoritos" className="hidden md:flex">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative">
              <Heart className={`h-4.5 w-4.5 ${hasFavorites ? "text-destructive fill-destructive" : ""}`} />
              {hasFavorites && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {totalFavorites > 9 ? "9+" : totalFavorites}
                </span>
              )}
            </Button>
          </Link>
          
          {/* Desktop User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:inline-flex">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-primary text-primary-foreground hover:bg-primary-hover relative">
                {user ? (
                  <span className="text-sm font-bold">
                    {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
                {isAdmin && adminNotifCounts.total > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {adminNotifCounts.total > 9 ? "9+" : adminNotifCounts.total}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover shadow-elevated rounded-xl">
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">{profile?.full_name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              
              {menuEntries.map((entry) => {
                const EntryIcon = ENTRY_ICONS[entry.id];
                const badge = entry.id === "suporte" ? unreadCount : entry.id === "admin" ? adminNotifCounts.total : 0;
                return (
                  <DropdownMenuItem asChild key={entry.id}>
                    <Link
                      to={entry.to}
                      className={`flex items-center gap-2 cursor-pointer ${entry.id === "admin" ? "text-primary font-medium" : ""}`}
                    >
                      <EntryIcon className="h-4 w-4" />
                      {entry.label}
                      {badge > 0 && (
                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${entry.id === "admin" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <AIChatSheet trigger={
                  <button className="flex items-center gap-2 w-full text-left cursor-pointer px-2 py-1.5 text-sm">
                    <Bot className="h-4 w-4" />
                    Assistente
                  </button>
                } />
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {user ? (
                <>
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/auth" className="flex items-center gap-2 cursor-pointer">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-primary text-primary-foreground hover:bg-primary-hover relative">
                {user ? (
                  <span className="text-sm font-bold">
                    {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
                {isAdmin && adminNotifCounts.total > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {adminNotifCounts.total > 9 ? "9+" : adminNotifCounts.total}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0 bg-card">
              {/* Mobile menu header */}
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <BrandLogo size="sm" />
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
              
              {/* User info */}
              {user && (
                <div className="px-3 py-3 border-b border-border bg-secondary/50">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.full_name || "Usuário"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <nav className="flex flex-col p-2.5 gap-0.5">
                {/* Main navigation */}
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 pt-2 pb-1">Navegação</p>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}
                
                <div className="h-px bg-border my-1.5" />
                
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 pt-1 pb-1">Ações</p>
                
                <Link
                  to="/favoritos"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Heart className={`h-4 w-4 ${hasFavorites ? "text-destructive fill-destructive" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">Favoritos</span>
                  {hasFavorites && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {totalFavorites}
                    </span>
                  )}
                </Link>
                
                {menuEntries.map((entry) => {
                  const EntryIcon = ENTRY_ICONS[entry.id];
                  const badge = entry.id === "suporte" ? unreadCount : entry.id === "admin" ? adminNotifCounts.total : 0;
                  return (
                    <Link
                      key={entry.id}
                      to={entry.to}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors ${entry.id === "admin" ? "text-primary" : ""}`}
                    >
                      <EntryIcon className={`h-4 w-4 ${entry.id === "admin" ? "" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium">{entry.label}</span>
                      {badge > 0 && (
                        <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${entry.id === "admin" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* AI Assistant - Mobile */}
                <AIChatSheet trigger={
                  <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors w-full text-left">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Assistente</span>
                  </button>
                } />
                
                <div className="h-px bg-border my-1.5" />
                
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 pt-1 pb-1">Conta</p>
                
                {user ? (
                  <>
                    <button
                      onClick={() => { handleSignOut(); setIsOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors w-full text-left text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">Sair</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <LogIn className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Entrar</span>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
