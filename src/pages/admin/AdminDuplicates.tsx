import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Phone, Building2 } from "lucide-react";

interface DuplicateGroup {
  key: string;
  type: "phone" | "whatsapp";
  value: string;
  establishments: { id: string; name: string; phone: string; whatsapp: string | null; neighborhood: string | null; active: boolean | null }[];
}

export default function AdminDuplicates() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    findDuplicates();
  }, []);

  const findDuplicates = async () => {
    try {
      const { data, error } = await supabase
        .from("establishments")
        .select("id, name, phone, whatsapp, neighborhood, active")
        .order("name");

      if (error) throw error;
      if (!data) return;

      const phoneMap = new Map<string, typeof data>();
      const whatsappMap = new Map<string, typeof data>();

      for (const est of data) {
        const cleanPhone = est.phone?.replace(/\D/g, "");
        if (cleanPhone && cleanPhone.length >= 10) {
          if (!phoneMap.has(cleanPhone)) phoneMap.set(cleanPhone, []);
          phoneMap.get(cleanPhone)!.push(est);
        }
        const cleanWa = est.whatsapp?.replace(/\D/g, "");
        if (cleanWa && cleanWa.length >= 10) {
          if (!whatsappMap.has(cleanWa)) whatsappMap.set(cleanWa, []);
          whatsappMap.get(cleanWa)!.push(est);
        }
      }

      const result: DuplicateGroup[] = [];
      phoneMap.forEach((ests, key) => {
        if (ests.length > 1) result.push({ key: `phone-${key}`, type: "phone", value: key, establishments: ests });
      });
      whatsappMap.forEach((ests, key) => {
        if (ests.length > 1) result.push({ key: `wa-${key}`, type: "whatsapp", value: key, establishments: ests });
      });

      setGroups(result);
    } catch (err) {
      console.error("Error finding duplicates:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Empresas Duplicadas | Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Empresas Duplicadas</h2>
          <p className="text-muted-foreground">
            Empresas que compartilham o mesmo telefone ou WhatsApp
          </p>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma duplicação encontrada 🎉</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {group.type === "phone" ? "Mesmo Telefone" : "Mesmo WhatsApp"}:
                    <span className="font-mono text-sm">{group.value}</span>
                    <Badge variant="outline" className="ml-auto">{group.establishments.length} empresas</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.establishments.map((est) => (
                      <div key={est.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{est.name}</p>
                            <p className="text-xs text-muted-foreground">{est.neighborhood || "Sem bairro"}</p>
                          </div>
                        </div>
                        <Badge variant={est.active ? "default" : "secondary"}>
                          {est.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
