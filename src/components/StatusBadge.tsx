import { isOpenNow } from "@/lib/scheduleUtils";
import { Truck } from "lucide-react";

interface StatusBadgeProps {
  schedule?: string;
  hasDelivery?: boolean;
  className?: string;
}

export function OpenClosedBadge({ schedule }: { schedule?: string }) {
  if (!schedule) return null;
  
  const isOpen = isOpenNow(schedule);
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
        isOpen
          ? "bg-green-500 text-white"
          : "bg-red-500 text-white"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-white animate-pulse" : "bg-white/70"}`} />
      {isOpen ? "Aberto" : "Fechado"}
    </span>
  );
}

export function DeliveryBadge({ hasDelivery }: { hasDelivery?: boolean }) {
  if (!hasDelivery) return null;
  
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white shadow-sm">
      <Truck className="h-3 w-3" />
      Delivery
    </span>
  );
}

export function StatusBadges({ schedule, hasDelivery, className = "" }: StatusBadgeProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      <OpenClosedBadge schedule={schedule} />
      <DeliveryBadge hasDelivery={hasDelivery} />
    </div>
  );
}
