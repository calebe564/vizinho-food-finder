import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, ShoppingCart, Croissant, Pill, Shirt, Wrench, MoreHorizontal } from "lucide-react";

const categories = [
  { id: "restaurante", label: "Restaurantes", icon: UtensilsCrossed, color: "text-orange-500" },
  { id: "lanchonete", label: "Lanchonetes", icon: UtensilsCrossed, color: "text-amber-500" },
  { id: "padaria", label: "Padarias", icon: Croissant, color: "text-yellow-500" },
  { id: "supermercado", label: "Supermercados", icon: ShoppingCart, color: "text-green-500" },
  { id: "açougue", label: "Açougues", icon: ShoppingCart, color: "text-red-600" },
  { id: "hortifruti", label: "Hortifruti", icon: ShoppingCart, color: "text-green-600" },
  { id: "pizzaria", label: "Pizzarias", icon: UtensilsCrossed, color: "text-red-500" },
  { id: "hamburgueria", label: "Hamburguerias", icon: UtensilsCrossed, color: "text-orange-600" },
  { id: "bar", label: "Bares", icon: UtensilsCrossed, color: "text-blue-500" },
  { id: "cafe", label: "Cafés", icon: Croissant, color: "text-amber-700" },
  { id: "outro", label: "Outros", icon: MoreHorizontal, color: "text-gray-500" }
];

export default function Categories() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Categorias</h1>
          <p className="text-muted-foreground mb-8">
            Explore estabelecimentos por categoria
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/?category=${category.id}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`p-4 rounded-full bg-muted mb-4 ${category.color}`}>
                      <category.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-lg">{category.label}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
