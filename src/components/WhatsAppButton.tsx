import { MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

export function WhatsAppButton() {
  // Link configurável - você pode alterar este número posteriormente
  const whatsappNumber = "5531999999999";
  const message = "Olá! Gostaria de falar com o Comércio Vizinho.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        size="lg"
        className="rounded-full shadow-lg hover:shadow-xl transition-shadow gap-2 h-14 px-6"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Falar com Comércio Vizinho</span>
        <span className="sm:hidden">Contato</span>
      </Button>
    </a>
  );
}
