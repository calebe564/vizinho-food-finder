import { toast } from "sonner";

interface ShareData {
  title: string;
  text?: string;
  url: string;
}

export async function shareContent(data: ShareData): Promise<boolean> {
  // Tenta usar Web Share API
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      // Usuário cancelou ou erro
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
      }
      return false;
    }
  }
  return false;
}

export function shareViaWhatsApp(text: string, url: string) {
  const message = encodeURIComponent(`${text}\n${url}`);
  window.open(`https://wa.me/?text=${message}`, "_blank");
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success("Link copiado!");
  }).catch(() => {
    toast.error("Erro ao copiar link");
  });
}

export function formatWhatsAppNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, "");
  return cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
}
