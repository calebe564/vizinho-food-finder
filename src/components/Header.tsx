import { Link, useNavigate } from "react-router-dom";
import { Home, Building2, Store, Menu, Heart, LogIn, LogOut, User, Briefcase, UserPlus, X, MapPin, MoreVertical, MessageSquare, ClipboardCheck, Bot, Crown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import logo from "@/assets/logo.png";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEstablishmentRequest } from "@/hooks/useEstablishmentRequest";
import { useActiveEstablishment } from "@/contexts/ActiveEstablishmentContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useUnreadConversations } from "@/hooks/useUnreadConversations";
import { AIChatSheet } from "./AIChatSheet";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { totalFavorites } = useFavorites();
  const { user, profile, signOut, isAdmin } = useAuth();
  const { isEmpresario, isAdmin: isAdminRole, isLoading: roleLoading } = useUserRole();
  const { hasApprovedRequest, isLoading: requestLoading } = useEstablishmentRequest();
  const { count: establishmentCount, isLoading: estLoading } = useActiveEstablishment();
  const navigate = useNavigate();
  const hasFavorites = totalFavorites > 0;
  
  const showMyEstablishment = user && (isEmpresario || hasApprovedRequest || establishmentCount > 0) && !isAdminRole && !roleLoading && !requestLoading;
  const businessMenuLabel = establishmentCount > 1 ? "Empresas" : "Minha Empresa";
  const showClaimButton = user && !isAdminRole && !roleLoading;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  const { unreadCount } = useUnreadConversations();
  const { counts: adminNotifCounts } = useAdminNotifications();
  
  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/estabelecimentos", label: "Empresas" },
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container flex h-14 md:h-16 items-center justify-between px-3 md:px-4">
        {/* Logo */}
        <Link to="/informacoes" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
          <MapPin className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm md:text-base text-primary tracking-tight">Comércio</span>
            <span className="font-bold text-sm md:text-base text-foreground -mt-0.5 tracking-tight">Vizinho</span>
          </div>
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
              
              {showMyEstablishment ? (
                <DropdownMenuItem asChild>
                  <Link to="/minha-empresa" className="flex items-center gap-2 cursor-pointer">
                    <Briefcase className="h-4 w-4" />
                    {businessMenuLabel}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/cadastrar" className="flex items-center gap-2 cursor-pointer">
                    <UserPlus className="h-4 w-4" />
                    Cadastrar Empresa
                  </Link>
                </DropdownMenuItem>
              )}
              
              {showClaimButton && (
                <DropdownMenuItem asChild>
                  <Link to="/reivindicar-empresa" className="flex items-center gap-2 cursor-pointer">
                    <ClipboardCheck className="h-4 w-4" />
                    Reivindicar Empresa
                  </Link>
                </DropdownMenuItem>
              )}
              
              {user && (
                <DropdownMenuItem asChild>
                  <Link to="/suporte" className="flex items-center gap-2 cursor-pointer relative">
                    <MessageSquare className="h-4 w-4" />
                    Suporte
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
              )}

              {user && (
                <DropdownMenuItem asChild>
                  <Link to="/planos" className="flex items-center gap-2 cursor-pointer">
                    <Crown className="h-4 w-4" />
                    Meu Plano
                  </Link>
                </DropdownMenuItem>
              
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
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="flex items-center gap-2 cursor-pointer text-primary font-medium">
                        Painel Administrativo
                        {adminNotifCounts.total > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                            {adminNotifCounts.total > 9 ? "9+" : adminNotifCounts.total}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  )}
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
                  <MapPin className="h-4 w-4 text-primary" />
                  <div className="flex flex-col leading-none">
                    <span className="font-bold text-xs text-primary">Comércio</span>
                    <span className="font-bold text-xs text-foreground -mt-0.5">Vizinho</span>
                  </div>
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
                
                {showMyEstablishment ? (
                  <Link
                    to="/minha-empresa"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{businessMenuLabel}</span>
                  </Link>
                ) : (
                  <Link
                    to="/cadastrar"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Cadastrar Empresa</span>
                  </Link>
                )}

                {user && (
                  <Link
                    to="/suporte"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors relative"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Suporte</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                )}
                
                {showClaimButton && (
                  <Link
                    to="/reivindicar-empresa"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Reivindicar Empresa</span>
                  </Link>
                )}
                
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
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-primary"
                      >
                        <span className="text-sm font-medium">Painel Admin</span>
                        {adminNotifCounts.total > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                            {adminNotifCounts.total > 9 ? "9+" : adminNotifCounts.total}
                          </span>
                        )}
                      </Link>
                    )}
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
