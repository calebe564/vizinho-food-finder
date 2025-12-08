import { Link } from "react-router-dom";
import { Home, Building2, ListChecks, UserPlus, Menu, LogIn } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "./ui/navigation-menu";
import logo from "@/assets/logo.png";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 hover-scale">
          <img src={logo} alt="Comércio Vizinho" className="h-10 w-10 rounded-xl" />
          <span className="font-bold text-lg hidden sm:inline-block">Comércio Vizinho</span>
        </Link>

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
                  <ListChecks className="mr-2 h-4 w-4" />
                  Empresas
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/cadastrar">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-all hover:bg-primary/90">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Empresa
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <Link to="/admin/login" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm" className="rounded-xl">
              <LogIn className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
          <ThemeToggle />
          
          {/* Menu Mobile */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <div className="flex items-center gap-3 p-6 border-b">
                <img src={logo} alt="Comércio Vizinho" className="h-10 w-10 rounded-xl" />
                <span className="font-bold text-lg">Comércio Vizinho</span>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                  <Home className="h-5 w-5" />
                  <span className="font-medium">Início</span>
                </Link>
                <Link to="/categorias" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">Categorias</span>
                </Link>
                <Link to="/estabelecimentos" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                  <ListChecks className="h-5 w-5" />
                  <span className="font-medium">Empresas</span>
                </Link>
                <Link to="/cadastrar" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground transition-colors mt-2">
                  <UserPlus className="h-5 w-5" />
                  <span className="font-medium">Cadastrar Empresa</span>
                </Link>
                <div className="border-t mt-4 pt-4">
                  <Link to="/admin/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                    <LogIn className="h-5 w-5" />
                    <span className="font-medium">Área Administrativa</span>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
