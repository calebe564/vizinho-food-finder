import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectPath?: string;
}

export function AuthRequiredDialog({ open, onOpenChange, redirectPath = '/cadastrar' }: AuthRequiredDialogProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/auth', { state: { from: redirectPath } });
  };

  const handleSignup = () => {
    onOpenChange(false);
    navigate('/auth', { state: { from: redirectPath } });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Login necessário</AlertDialogTitle>
          <AlertDialogDescription>
            Você precisa estar logado para cadastrar uma empresa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignup} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Criar conta
          </AlertDialogAction>
          <AlertDialogAction onClick={handleLogin} className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Entrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
