import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";

export default function AdminEstablishments() {
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("*")
        .order("name");

      if (error) throw error;
      setEstablishments(data || []);
    } catch (error: any) {
      console.error("Error fetching establishments:", error);
      toast.error("Erro ao carregar estabelecimentos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("establishments")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Estabelecimento excluído com sucesso");
      fetchEstablishments();
    } catch (error: any) {
      console.error("Error deleting establishment:", error);
      toast.error("Erro ao excluir estabelecimento");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("establishments")
        .update({ active: !currentActive })
        .eq("id", id);

      if (error) throw error;

      toast.success(
        !currentActive ? "Estabelecimento ativado" : "Estabelecimento desativado"
      );
      fetchEstablishments();
    } catch (error: any) {
      console.error("Error toggling active:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const filtered = establishments.filter((est) =>
    est.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Catálogo de Empresas</h2>
        <Button onClick={() => navigate("/admin/dashboard/estabelecimentos/adicionar")}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Empresa
        </Button>
      </div>

      <Input
        placeholder="Buscar por nome..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum estabelecimento encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((est) => (
                <TableRow key={est.id}>
                  <TableCell className="font-medium">{est.name}</TableCell>
                  <TableCell className="capitalize">{est.category}</TableCell>
                  <TableCell>{est.neighborhood || "-"}</TableCell>
                  <TableCell>{est.region || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={est.active ? "default" : "secondary"}>
                      {est.active ? "Ativa" : "Inativa"}
                    </Badge>
                    {est.is_paid && (
                      <Badge variant="outline" className="ml-1">Destaque</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(est.id, est.active)}
                      title={est.active ? "Desativar" : "Ativar"}
                    >
                      {est.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/admin/dashboard/estabelecimentos/editar/${est.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(est.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmPasswordDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Estabelecimento"
        description="Esta ação é irreversível. Digite a senha de administrador para confirmar a exclusão."
        actionLabel="Excluir"
        variant="destructive"
      />
    </div>
  );
}
