import { Link } from "react-router-dom";
import { Home, Building2, MapPin, ListChecks, UserPlus, MessageCircle, Info, Menu, LogIn } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu";
import logo from "@/assets/logo.png";
export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  return <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Comércio Vizinho" className="h-10 w-10" />
          
        </Link>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  <Home className="mr-2 h-4 w-4" />
                  Início
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/categorias">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  <Building2 className="mr-2 h-4 w-4" />
                  Categorias
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/bairros">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  <MapPin className="mr-2 h-4 w-4" />
                  Bairros
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/estabelecimentos">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  <ListChecks className="mr-2 h-4 w-4" />
                  Empresas
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/cadastrar">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar Empresa
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link to="/sobre">
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  <Info className="mr-2 h-4 w-4" />
                  Sobre
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <Link to="/admin/login" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
          <ThemeToggle />
          
          {/* Menu Mobile */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                  <Home className="h-5 w-5" />
                  <span>Início</span>
                </Link>
                <Link to="/categorias" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                  <Building2 className="h-5 w-5" />
                  <span>Categorias</span>
                </Link>
                <Link to="/bairros" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                  <MapPin className="h-5 w-5" />
                  <span>Bairros</span>
                </Link>
                <Link to="/estabelecimentos" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                  <ListChecks className="h-5 w-5" />
                  <span>Empresas</span>
                </Link>
                <Link to="/cadastrar" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                  <UserPlus className="h-5 w-5" />
                  <span>Cadastrar Empresa</span>
                </Link>
                <Link to="/sobre" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                  <Info className="h-5 w-5" />
                  <span>Sobre</span>
                </Link>
                <Link to="/admin/login" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-accent transition-colors border-t mt-2 pt-5">
                  <LogIn className="h-5 w-5" />
                  <span>Área Administrativa</span>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>;
}