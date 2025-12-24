import { z } from "zod";

// Password requirements
export const PASSWORD_MIN_LENGTH = 8;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Password validation schema with strong requirements
export const passwordSchema = z.string()
  .min(PASSWORD_MIN_LENGTH, `Senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Senha deve conter pelo menos um caractere especial (!@#$%^&*...)");

export const emailSchema = z.string()
  .trim()
  .email("Email inválido")
  .max(255, "Email muito longo");

export const authFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Validate password and return errors
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Uma letra maiúscula");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Uma letra minúscula");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Um número");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Um caractere especial");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Password strength indicator
export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  if (score <= 2) return { score, label: "Fraca", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Média", color: "bg-yellow-500" };
  return { score, label: "Forte", color: "bg-green-500" };
}

// Brute force protection - track login attempts in localStorage
const LOGIN_ATTEMPTS_KEY = "login_attempts";
const LOCKOUT_TIME_KEY = "login_lockout_until";

interface LoginAttempts {
  count: number;
  lastAttempt: number;
}

export function getLoginAttempts(): LoginAttempts {
  try {
    const data = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn("Could not read login attempts", e);
  }
  return { count: 0, lastAttempt: 0 };
}

export function recordFailedAttempt(): void {
  try {
    const attempts = getLoginAttempts();
    const now = Date.now();
    
    // Reset count if last attempt was more than lockout duration ago
    if (now - attempts.lastAttempt > LOCKOUT_DURATION_MS) {
      attempts.count = 0;
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
    
    // Set lockout if too many attempts
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_TIME_KEY, (now + LOCKOUT_DURATION_MS).toString());
    }
  } catch (e) {
    console.warn("Could not record login attempt", e);
  }
}

export function clearLoginAttempts(): void {
  try {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_TIME_KEY);
  } catch (e) {
    console.warn("Could not clear login attempts", e);
  }
}

export function isLockedOut(): { locked: boolean; remainingTime: number } {
  try {
    const lockoutUntil = localStorage.getItem(LOCKOUT_TIME_KEY);
    if (lockoutUntil) {
      const lockoutTime = parseInt(lockoutUntil, 10);
      const now = Date.now();
      if (now < lockoutTime) {
        return { 
          locked: true, 
          remainingTime: Math.ceil((lockoutTime - now) / 1000 / 60) // minutes
        };
      } else {
        // Lockout expired, clear it
        clearLoginAttempts();
      }
    }
  } catch (e) {
    console.warn("Could not check lockout", e);
  }
  return { locked: false, remainingTime: 0 };
}
