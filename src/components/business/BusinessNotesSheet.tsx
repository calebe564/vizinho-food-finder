import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { StickyNote, Plus, Edit2, Trash2, Loader2, X, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BusinessNote {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface BusinessNotesSheetProps {
  establishmentId?: string;
}

export function BusinessNotesSheet({ establishmentId }: BusinessNotesSheetProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('business_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotes();
    }
  }, [open, user]);

  const handleAddNote = async () => {
    if (!user || !newNoteContent.trim()) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('business_notes')
        .insert({
          user_id: user.id,
          establishment_id: establishmentId || null,
          content: newNoteContent.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNoteContent('');
      toast.success('Nota criada!');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Erro ao criar nota');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (id: string) => {
    if (!editContent.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_notes')
        .update({ content: editContent.trim() })
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.map(n => n.id === id ? { ...n, content: editContent.trim(), updated_at: new Date().toISOString() } : n));
      setEditingId(null);
      setEditContent('');
      toast.success('Nota atualizada!');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Erro ao atualizar nota');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== id));
      toast.success('Nota removida!');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Erro ao remover nota');
    }
  };

  const lastNote = notes[0];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Card className="border-0 shadow-elevated rounded-2xl cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <StickyNote className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm">Notas Internas</span>
                {lastNote ? (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Última: {lastNote.content.substring(0, 40)}...
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Crie notas para organizar suas tarefas
                  </p>
                )}
              </div>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Notas Internas
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Nova nota */}
          <div className="space-y-2">
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Escreva uma nova nota..."
              className="min-h-[80px]"
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim() || saving}
              className="w-full"
              size="sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar Nota
            </Button>
          </div>

          {/* Lista de notas */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8">
                <StickyNote className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma nota criada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Card key={note.id} className="border">
                    <CardContent className="p-3">
                      {editingId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null);
                                setEditContent('');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={saving}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.updated_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingId(note.id);
                                  setEditContent(note.content);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
