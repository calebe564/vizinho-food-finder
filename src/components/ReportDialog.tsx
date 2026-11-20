import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import {
  REPORT_CONTACT_MAX,
  REPORT_DETAILS_MAX,
  REPORT_REASONS,
  reportErrorMessage,
  validateReport,
  type ReportErrors,
  type ReportReason,
  type ReportTarget,
} from "@/lib/reports";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTarget;
  targetId: string;
  targetName: string;
}

export function ReportDialog({ open, onOpenChange, targetType, targetId, targetName }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [errors, setErrors] = useState<ReportErrors>({});

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseUntyped.rpc("submit_report", {
        _target_type: targetType,
        _target_id: targetId,
        _reason: reason,
        _details: details.trim() || null,
        _contact: contact.trim() || null,
      });
      if (error) throw new Error(reportErrorMessage(error.message));
    },
    onSuccess: () => {
      toast.success("Denúncia recebida. Nossa equipe vai analisar.");
      setReason("");
      setDetails("");
      setContact("");
      setErrors({});
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível enviar a denúncia."),
  });

  const handleSubmit = () => {
    const found = validateReport({ reason, details, contact });
    setErrors(found);
    if (Object.keys(found).length === 0) submit.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{targetType === "product" ? "Denunciar produto" : "Denunciar empresa"}</DialogTitle>
          <DialogDescription>
            {targetName}. Cada denúncia é analisada por uma pessoa da nossa equipe. Veja o que não é permitido na{" "}
            <Link to="/politica-de-produtos-proibidos" className="text-primary underline underline-offset-2" onClick={() => onOpenChange(false)}>
              política de produtos proibidos
            </Link>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset>
            <legend className="text-sm font-medium mb-2">Qual é o problema?</legend>
            <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)} className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-start gap-2 rounded-lg border border-border p-2.5">
                  <RadioGroupItem value={r.value} id={`motivo-${r.value}`} className="mt-0.5" />
                  <Label htmlFor={`motivo-${r.value}`} className="cursor-pointer leading-snug">
                    <span className="block text-sm font-medium">{r.label}</span>
                    <span className="block text-xs text-muted-foreground">{r.hint}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.reason && <p className="text-xs text-destructive mt-1" role="alert">{errors.reason}</p>}
          </fieldset>

          <div>
            <Label htmlFor="denuncia-detalhes">Detalhes {reason === "outro" ? "" : "(opcional)"}</Label>
            <Textarea
              id="denuncia-detalhes"
              rows={4}
              value={details}
              maxLength={REPORT_DETAILS_MAX}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Conte o que aconteceu, sem dados pessoais desnecessários."
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span className="text-destructive" role="alert">{errors.details}</span>
              <span>{details.length}/{REPORT_DETAILS_MAX}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="denuncia-contato">E-mail ou telefone para retorno (opcional)</Label>
            <Input
              id="denuncia-contato"
              value={contact}
              maxLength={REPORT_CONTACT_MAX}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Só usamos se precisarmos de mais informações"
            />
            {errors.contact && <p className="text-xs text-destructive mt-1" role="alert">{errors.contact}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submit.isPending}>
            {submit.isPending ? "Enviando..." : "Enviar denúncia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
