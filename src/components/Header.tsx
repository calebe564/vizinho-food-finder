import { Link, useNavigate } from "react-router-dom";
import { Home, Building2, Store, Menu, Heart, LogIn, LogOut, User, Briefcase, UserPlus, X } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { totalFavorites } = useFavorites();
  const { user, profile, signOut, isAdmin } = useAuth();
  const { isEmpresario, isLoading: roleLoading } = useUserRole();
  const { hasApprovedRequest, isLoading: requestLoading } = useEstablishmentRequest();
  const navigate = useNavigate();
  const hasFavorites = totalFavorites > 0;
  
  const showMyEstablishment = user && (isEmpresario || hasApprovedRequest) && !roleLoading && !requestLoading;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  const navLinks = [
    { to: "/", label: "Início", icon: Home },
    { to: "/categorias", label: "Categorias", icon: Building2 },
    { to: "/estabelecimentos", label: "Empresas", icon: Store },
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur-xl shadow-sm">
      <div className="container flex h-14 md:h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/informacoes" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <img src={logo} alt="Comércio Vizinho" className="h-9 w-9 md:h-10 md:w-10 rounded-xl shadow-sm" />
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-base md:text-lg text-primary leading-tight">Comércio</span>
            <span className="font-bold text-base md:text-lg text-foreground leading-tight -mt-1">Vizinho</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl transition-all"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {/* Favorites indicator - Desktop */}
          <Link to="/favoritos" className="hidden md:flex">
            <Button variant="ghost" size="icon" className="rounded-xl relative">
              <Heart className={`h-5 w-5 ${hasFavorites ? "text-destructive fill-destructive" : ""}`} />
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
              <Button variant="ghost" size="icon" className="rounded-xl">
                {user ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-5 w-5" />
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
                    ADM espaço empresa
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
              
              <DropdownMenuSeparator />
              
              {user ? (
                <>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/login" className="flex items-center gap-2 cursor-pointer text-primary font-medium">
                        Painel Administrativo
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
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0 bg-card">
              {/* Mobile menu header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <img src={logo} alt="Comércio Vizinho" className="h-9 w-9 rounded-xl" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-primary leading-tight">Comércio</span>
                    <span className="font-bold text-sm text-foreground leading-tight -mt-0.5">Vizinho</span>
                  </div>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
              
              {/* User info */}
              {user && (
                <div className="px-4 py-3 border-b border-border/50 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.full_name || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <nav className="flex flex-col p-3 gap-1">
                {/* Main navigation */}
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 pt-2 pb-1">Navegação</p>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    <link.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}
                
                <div className="h-px bg-border/50 my-2" />
                
                {/* Quick actions */}
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 pt-1 pb-1">Ações rápidas</p>
                
                <Link
                  to="/favoritos"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-colors"
                >
                  <Heart className={`h-5 w-5 ${hasFavorites ? "text-destructive fill-destructive" : "text-muted-foreground"}`} />
                  <span className="font-medium">Favoritos</span>
                  {hasFavorites && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                      {totalFavorites}
                    </span>
                  )}
                </Link>
                
                {showMyEstablishment ? (
                  <Link
                    to="/minha-empresa"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">ADM espaço empresa</span>
                  </Link>
                ) : (
                  <Link
                    to="/cadastrar"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Cadastrar Empresa</span>
                  </Link>
                )}
                
                <div className="h-px bg-border/50 my-2" />
                
                {/* Account */}
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-3 pt-1 pb-1">Conta</p>
                
                {user ? (
                  <>
                    {isAdmin && (
                      <Link
                        to="/admin/login"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-colors text-primary"
                      >
                        <span className="font-medium">Painel Administrativo</span>
                      </Link>
                    )}
                    <button
                      onClick={() => { handleSignOut(); setIsOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 transition-colors w-full text-left text-destructive"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Sair</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
                  >
                    <LogIn className="h-5 w-5" />
                    <span className="font-medium">Entrar</span>
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
