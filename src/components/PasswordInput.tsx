import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { validatePassword, getPasswordStrength, PASSWORD_MIN_LENGTH } from "@/lib/passwordValidation";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showRequirements?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••",
  showRequirements = false,
  required = false,
  disabled = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const validation = showRequirements ? validatePassword(value) : null;
  const strength = showRequirements && value.length > 0 ? getPasswordStrength(value) : null;

  const requirements = [
    { label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`, check: value.length >= PASSWORD_MIN_LENGTH },
    { label: "Letra maiúscula (A-Z)", check: /[A-Z]/.test(value) },
    { label: "Letra minúscula (a-z)", check: /[a-z]/.test(value) },
    { label: "Número (0-9)", check: /[0-9]/.test(value) },
    { label: "Caractere especial (!@#$...)", check: /[!@#$%^&*(),.?":{}|<>]/.test(value) },
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
          required={required}
          disabled={disabled}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      
      {showRequirements && value.length > 0 && (
        <div className="space-y-2 mt-3">
          {/* Strength indicator */}
          {strength && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Força da senha:</span>
                <span className={cn(
                  strength.score <= 2 ? "text-red-500" : 
                  strength.score <= 4 ? "text-yellow-500" : "text-green-500"
                )}>
                  {strength.label}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all", strength.color)}
                  style={{ width: `${(strength.score / 6) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Requirements checklist */}
          <div className="grid grid-cols-1 gap-1 text-xs">
            {requirements.map((req, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  req.check ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {req.check ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
