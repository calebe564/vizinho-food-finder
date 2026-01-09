import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "1 letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "1 letra minúscula", met: /[a-z]/.test(password) },
    { label: "1 número", met: /[0-9]/.test(password) },
  ];

  const metCount = requirements.filter(r => r.met).length;
  
  const getStrengthColor = () => {
    if (metCount === 0) return 'bg-muted';
    if (metCount === 1) return 'bg-red-500';
    if (metCount === 2) return 'bg-orange-500';
    if (metCount === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= metCount ? getStrengthColor() : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-1 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
