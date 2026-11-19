import {
  Beef, Beer, BookOpen, Briefcase, Car, Coffee, Croissant, Drumstick, Dumbbell, Flower2,
  Footprints, GraduationCap, Hammer, IceCream, MoreHorizontal, PawPrint, Pill, Pizza, Scissors,
  Shirt, ShoppingCart, Smartphone, Sparkles, Stethoscope, Store, UtensilsCrossed, WashingMachine,
  Wrench, type LucideIcon,
} from "lucide-react";
import { segmentOf, type SegmentId } from "./categories";

const ICONS: Record<string, LucideIcon> = {
  restaurante: UtensilsCrossed, lanchonete: UtensilsCrossed, padaria: Croissant, açougue: Beef,
  hortifruti: ShoppingCart, pizzaria: Pizza, hamburgueria: UtensilsCrossed, bar: Beer, cafe: Coffee,
  sorveteria: IceCream, acai: IceCream, espetinho: Drumstick,
  supermercado: ShoppingCart, moda: Shirt, calcados: Footprints, farmacia: Pill, pet_shop: PawPrint,
  papelaria: BookOpen, eletronicos: Smartphone, casa_construcao: Hammer, floricultura: Flower2,
  salao_beleza: Sparkles, barbearia: Scissors, mecanica: Car, academia: Dumbbell, saude: Stethoscope,
  educacao: GraduationCap, assistencia_tecnica: Wrench, reparos_manutencao: Hammer,
  lavanderia: WashingMachine, servicos_profissionais: Briefcase,
  outro: MoreHorizontal,
};

const SEGMENT_FALLBACK: Record<SegmentId, LucideIcon> = {
  alimentacao: UtensilsCrossed, comercio: Store, servicos: Briefcase, outros: MoreHorizontal,
};

/** Ícone da categoria; se não houver, usa o do segmento; por último, "loja". */
export function categoryIcon(value?: string | null): LucideIcon {
  if (value && ICONS[value]) return ICONS[value];
  const segment = segmentOf(value);
  return segment ? SEGMENT_FALLBACK[segment] : Store;
}

export const segmentIcon = (segment: SegmentId): LucideIcon => SEGMENT_FALLBACK[segment];
