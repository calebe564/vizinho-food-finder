import { Link } from "react-router-dom";
import { Home, Building2, Store, MoreVertical, UserPlus, LogIn, Heart, LogOut, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "./ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import logo from "@/assets/logo.png";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { totalFavorites } = useFavorites();
  const { isAuthenticated, user, signOut } = useAuth();
  const hasFavorites = totalFavorites > 0;

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    setIsOpen(false);
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/informacoes" className="flex items-center gap-3 hover-scale cursor-pointer">
          <img src={logo} alt="Comércio Vizinho" className="h-10 w-10 rounded-xl" />
          <span className="font-bold text-lg hidden sm:inline-block">Comércio Vizinho</span>
        </Link>

        {/* Desktop Navigation - Only main items visible */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium transition-all hover:bg-secondary hover:text-foreground">
                  <Home className="mr-2 h-4 w-4" />
                  Início
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/categorias">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium transition-all hover:bg-secondary hover:text-foreground">
                  <Building2 className="mr-2 h-4 w-4" />
                  Categorias
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/estabelecimentos">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium transition-all hover:bg-secondary hover:text-foreground">
                  <Store className="mr-2 h-4 w-4" />
                  Empresas
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {/* Desktop Overflow Menu - Three vertical dots */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:inline-flex">
              <Button variant="ghost" size="icon" className="rounded-xl" title="Mais opções">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuItem asChild>
                <Link to="/favoritos" className="flex items-center gap-2 cursor-pointer">
                  <Heart className={`h-4 w-4 ${hasFavorites ? "text-red-500 fill-red-500" : ""}`} />
                  Favoritos {hasFavorites && `(${totalFavorites})`}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/cadastrar" className="flex items-center gap-2 cursor-pointer">
                  <UserPlus className="h-4 w-4" />
                  Cadastrar Empresa
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground cursor-default">
                    <User className="h-4 w-4" />
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/login" className="flex items-center gap-2 cursor-pointer">
                      <LogIn className="h-4 w-4" />
                      Área Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/auth" className="flex items-center gap-2 cursor-pointer">
                    <LogIn className="h-4 w-4" />
                    Login / Cadastro
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <div className="flex items-center gap-3 p-6 border-b">
                <img src={logo} alt="Comércio Vizinho" className="h-10 w-10 rounded-xl" />
                <span className="font-bold text-lg">Comércio Vizinho</span>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                <p className="text-xs text-muted-foreground px-4 pb-2 uppercase tracking-wider">Navegação</p>
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                  <Home className="h-5 w-5" />
                  <span className="font-medium">Início</span>
                </Link>
                <Link to="/categorias" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">Categorias</span>
                </Link>
                <Link to="/estabelecimentos" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                  <Store className="h-5 w-5" />
                  <span className="font-medium">Empresas</span>
                </Link>
                
                <div className="border-t mt-4 pt-4">
                  <p className="text-xs text-muted-foreground px-4 pb-2 uppercase tracking-wider">Mais opções</p>
                  <Link to="/favoritos" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                    <Heart className={`h-5 w-5 ${hasFavorites ? "text-red-500 fill-red-500" : ""}`} />
                    <span className="font-medium">Favoritos {hasFavorites && `(${totalFavorites})`}</span>
                  </Link>
                  <Link to="/cadastrar" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                    <UserPlus className="h-5 w-5" />
                    <span className="font-medium">Cadastrar Empresa</span>
                  </Link>
                </div>

                <div className="border-t mt-4 pt-4">
                  <p className="text-xs text-muted-foreground px-4 pb-2 uppercase tracking-wider">Conta</p>
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 text-muted-foreground">
                        <User className="h-5 w-5" />
                        <span className="font-medium text-sm truncate">{user?.email}</span>
                      </div>
                      <Link to="/admin/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                        <LogIn className="h-5 w-5" />
                        <span className="font-medium">Área Admin</span>
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors w-full text-destructive">
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Sair</span>
                      </button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                      <LogIn className="h-5 w-5" />
                      <span className="font-medium">Login / Cadastro</span>
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
