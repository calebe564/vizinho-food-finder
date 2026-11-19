import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORY_GROUPS } from "@/config/categories";
import { categoryIcon, segmentIcon } from "@/config/categoryIcons";

const SEGMENT_COLORS = {
  alimentacao: "text-orange-500",
  comercio: "text-emerald-600",
  servicos: "text-sky-600",
  outros: "text-gray-500",
} as const;

export default function Categories() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Categorias</h1>
          <p className="text-muted-foreground mb-8">
            Comida, comércio e serviços do seu bairro. Escolha uma categoria ou use a{" "}
            <Link to="/buscar" className="text-primary underline underline-offset-2">Bússola</Link>{" "}
            para procurar qualquer coisa.
          </p>

          <div className="space-y-10">
            {CATEGORY_GROUPS.map((group) => {
              const SegmentIcon = segmentIcon(group.id);
              return (
                <section key={group.id} aria-labelledby={`segmento-${group.id}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <SegmentIcon className={`h-5 w-5 ${SEGMENT_COLORS[group.id]}`} />
                    <h2 id={`segmento-${group.id}`} className="text-xl font-semibold">{group.label}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{group.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {group.options.map((category) => {
                      const Icon = categoryIcon(category.value);
                      return (
                        <Link key={category.value} to={`/?category=${encodeURIComponent(category.value)}`}>
                          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                              <div className={`p-3 rounded-full bg-muted mb-3 ${SEGMENT_COLORS[group.id]}`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <h3 className="font-medium text-sm">{category.label}</h3>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
