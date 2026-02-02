import { isOpenNow } from "@/lib/scheduleUtils";
import { Truck } from "lucide-react";

interface StatusBadgeProps {
  schedule?: string;
  hasDelivery?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function OpenClosedBadge({ 
  schedule, 
  size = "md" 
}: { 
  schedule?: string; 
  size?: "sm" | "md" | "lg";
}) {
  if (!schedule) return null;
  
  const isOpen = isOpenNow(schedule);
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2"
  };
  
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5"
  };
  
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold shadow-sm ${sizeClasses[size]} ${
        isOpen
          ? "bg-green-500 text-white"
          : "bg-red-500 text-white"
      }`}
    >
      <span className={`rounded-full bg-white ${dotSizes[size]} ${isOpen ? "animate-pulse" : "opacity-70"}`} />
      {isOpen ? "Aberto" : "Fechado"}
    </span>
  );
}

export function DeliveryBadge({ 
  hasDelivery,
  size = "md"
}: { 
  hasDelivery?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  if (!hasDelivery) return null;
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2"
  };
  
  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4"
  };
  
  return (
    <span className={`inline-flex items-center rounded-full font-semibold bg-blue-500 text-white shadow-sm ${sizeClasses[size]}`}>
      <Truck className={iconSizes[size]} />
      Delivery
    </span>
  );
}

export function StatusBadges({ 
  schedule, 
  hasDelivery, 
  className = "",
  size = "md"
}: StatusBadgeProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      <OpenClosedBadge schedule={schedule} size={size} />
      <DeliveryBadge hasDelivery={hasDelivery} size={size} />
    </div>
  );
}
