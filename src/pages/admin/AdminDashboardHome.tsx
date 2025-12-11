import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Tag, MapPin, Plus, List } from "lucide-react";

export default function AdminDashboardHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEstablishments: 0,
    byCategory: {} as Record<string, number>,
    byNeighborhood: {} as Record<string, number>,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: establishments, error } = await supabase
        .from("establishments")
        .select("category, neighborhood");

      if (error) throw error;

      const byCategory: Record<string, number> = {};
      const byNeighborhood: Record<string, number> = {};

      establishments?.forEach((est) => {
        byCategory[est.category] = (byCategory[est.category] || 0) + 1;
        if (est.neighborhood) {
          byNeighborhood[est.neighborhood] = (byNeighborhood[est.neighborhood] || 0) + 1;
        }
      });

      setStats({
        totalEstablishments: establishments?.length || 0,
        byCategory,
        byNeighborhood,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Empresas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEstablishments}</div>
            <p className="text-xs text-muted-foreground">
              Cadastradas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Categorias
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</div>
            <p className="text-xs text-muted-foreground">
              Diferentes categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bairros
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.byNeighborhood).length}</div>
            <p className="text-xs text-muted-foreground">
              Atendidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Atalhos Rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Button onClick={() => navigate("/admin/dashboard/estabelecimentos/adicionar")}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Empresa
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/dashboard/estabelecimentos")}>
            <List className="mr-2 h-4 w-4" />
            Ver Catálogo
          </Button>
        </CardContent>
      </Card>

      {/* Empresas por Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="capitalize text-sm">{category}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Bairro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byNeighborhood)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([neighborhood, count]) => (
                  <div key={neighborhood} className="flex justify-between items-center">
                    <span className="text-sm">{neighborhood}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
