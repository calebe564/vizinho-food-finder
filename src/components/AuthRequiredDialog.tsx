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
import { LogIn, AlertTriangle } from 'lucide-react';

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectPath?: string;
  message?: string;
}

export function AuthRequiredDialog({ 
  open, 
  onOpenChange, 
  redirectPath = '/cadastrar',
  message = 'Faça login para cadastrar sua empresa.'
}: AuthRequiredDialogProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/auth', { state: { from: redirectPath } });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Atenção
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você ainda não está logado. {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin} className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            Fazer Login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
