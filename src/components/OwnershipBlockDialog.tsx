import { useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MERCHANT_HOME } from '@/config/areas';

interface OwnershipBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}

export function OwnershipBlockDialog({ open, onOpenChange, message }: OwnershipBlockDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <DialogTitle className="text-center">Ação não permitida</DialogTitle>
          <DialogDescription className="text-center whitespace-pre-line">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={() => { onOpenChange(false); navigate(MERCHANT_HOME); }} className="w-full">
            <Briefcase className="h-4 w-4 mr-2" />
            Ir para minha empresa
          </Button>
          <Button variant="outline" onClick={() => { onOpenChange(false); navigate('/'); }} className="w-full">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
