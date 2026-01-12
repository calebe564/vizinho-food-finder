import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, 
  Shield, 
  Search, 
  Loader2, 
  Crown,
  UserCog,
  User,
  Building2,
  ChevronLeft,
  Settings,
  Clock,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ConfirmPasswordDialog } from '@/components/ConfirmPasswordDialog';

interface AdminPermissions {
  can_edit_establishments: boolean;
  can_approve_requests: boolean;
  can_manage_ads: boolean;
  can_view_conversations: boolean;
  can_manage_users: boolean;
  notes: string;
}

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_login_at: string | null;
  permissions?: AdminPermissions;
  isActive: boolean;
}

const roleLabels: Record<UserRole, string> = {
  adm_master: 'ADM Master',
  admin: 'ADM Secundário',
  pre_adm: 'ADM Secundário',
  empresario: 'Empresário',
  user: 'Usuário comum'
};

const roleColors: Record<UserRole, string> = {
  adm_master: 'bg-purple-500/10 text-purple-700 border-purple-200',
  admin: 'bg-blue-500/10 text-blue-700 border-blue-200',
  pre_adm: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
  empresario: 'bg-green-500/10 text-green-700 border-green-200',
  user: 'bg-gray-500/10 text-gray-700 border-gray-200'
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  adm_master: <Crown className="h-3 w-3" />,
  admin: <Shield className="h-3 w-3" />,
  pre_adm: <UserCog className="h-3 w-3" />,
  empresario: <Building2 className="h-3 w-3" />,
  user: <User className="h-3 w-3" />
};

const defaultPermissions: AdminPermissions = {
  can_edit_establishments: true,
  can_approve_requests: false,
  can_manage_ads: false,
  can_view_conversations: true,
  can_manage_users: false,
  notes: ''
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmMaster, canManageRoles, isLoading: roleLoading } = useUserRole();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<AdminPermissions>(defaultPermissions);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  useEffect(() => {
    if (!roleLoading && !canManageRoles) {
      navigate('/admin/dashboard');
      return;
    }
    
    fetchUsers();
  }, [roleLoading, canManageRoles, navigate]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, created_at, last_login_at')
        .order('full_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      const usersWithRoles: UserWithRole[] = [];
      
      for (const profile of profiles || []) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        const { data: permData } = await supabase
          .from('admin_permissions')
          .select('*')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        // Determinar status ativo baseado em login recente (últimos 30 dias)
        const isActive = profile.last_login_at 
          ? new Date(profile.last_login_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          : false;

        usersWithRoles.push({
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
          role: (roleData?.role as UserRole) || 'user',
          created_at: profile.created_at || '',
          last_login_at: profile.last_login_at,
          isActive,
          permissions: permData ? {
            can_edit_establishments: permData.can_edit_establishments,
            can_approve_requests: permData.can_approve_requests,
            can_manage_ads: permData.can_manage_ads,
            can_view_conversations: permData.can_view_conversations,
            can_manage_users: permData.can_manage_users,
            notes: permData.notes || ''
          } : undefined
        });
      }

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !isAdmMaster) return;

    if (selectedUser.email === 'johnvictorsf1512@gmail.com') {
      toast.error('Não é possível alterar a role do ADM Master');
      setIsDialogOpen(false);
      return;
    }

    setSaving(true);
    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: newRole
        });

      if (error) throw error;

      // Se virou admin, criar permissões padrão
      if (newRole === 'admin') {
        await supabase
          .from('admin_permissions')
          .upsert({
            user_id: selectedUser.user_id,
            ...defaultPermissions
          });
      }

      toast.success(`Role de ${selectedUser.full_name} alterada para ${roleLabels[newRole]}`);
      
      setUsers(prev => prev.map(u => 
        u.user_id === selectedUser.user_id 
          ? { ...u, role: newRole }
          : u
      ));
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error changing role:', err);
      toast.error('Erro ao alterar role');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPermissions = (u: UserWithRole) => {
    setSelectedUser(u);
    setPermissions(u.permissions || defaultPermissions);
    setIsPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_permissions')
        .upsert({
          user_id: selectedUser.user_id,
          ...permissions,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Permissões atualizadas');
      
      setUsers(prev => prev.map(u => 
        u.user_id === selectedUser.user_id 
          ? { ...u, permissions }
          : u
      ));
      
      setIsPermissionsDialogOpen(false);
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    const userToDelete = users.find(u => u.user_id === deleteUserId);
    if (userToDelete?.email === 'johnvictorsf1512@gmail.com') {
      toast.error('Não é possível excluir o ADM Master');
      setDeleteUserId(null);
      return;
    }

    setDeletingUser(true);
    try {
      // Remover permissões
      await supabase
        .from('admin_permissions')
        .delete()
        .eq('user_id', deleteUserId);

      // Remover roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deleteUserId);

      // Remover vínculos com estabelecimentos
      await supabase
        .from('user_establishments')
        .delete()
        .eq('user_id', deleteUserId);

      // Remover perfil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', deleteUserId);

      if (error) throw error;

      toast.success('Usuário excluído com sucesso');
      setUsers(prev => prev.filter(u => u.user_id !== deleteUserId));
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Erro ao excluir usuário');
    } finally {
      setDeletingUser(false);
      setDeleteUserId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManageRoles) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Usuários | Comércio Vizinho</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">Usuários cadastrados, roles e permissões</p>
          </div>
        </div>

        <Card className="border-0 shadow-elevated rounded-3xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários ({users.length})
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[u.role]}>
                          {roleIcons[u.role]}
                          <span className="ml-1">{roleLabels[u.role]}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.isActive ? 'bg-green-500/10 text-green-700 border-green-200' : 'bg-gray-500/10 text-gray-500 border-gray-200'}>
                          {u.isActive ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Ativo</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Inativo</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.last_login_at ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span title={format(new Date(u.last_login_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}>
                              {formatDistanceToNow(new Date(u.last_login_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.email !== 'johnvictorsf1512@gmail.com' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setNewRole(u.role);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <UserCog className="h-4 w-4 mr-1" />
                                Role
                              </Button>
                              {(u.role === 'admin' || u.role === 'pre_adm') && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenPermissions(u)}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Permissões
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setDeleteUserId(u.user_id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-700">
                              <Crown className="h-3 w-3 mr-1" />
                              Protegido
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para alterar role */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Role do Usuário</DialogTitle>
            <DialogDescription>
              Alterando role de <strong>{selectedUser?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Atual</Label>
              <Badge variant="outline" className={roleColors[selectedUser?.role || 'user']}>
                {roleIcons[selectedUser?.role || 'user']}
                <span className="ml-1">{roleLabels[selectedUser?.role || 'user']}</span>
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Label>Nova Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ADM Secundário</SelectItem>
                  <SelectItem value="user">Usuário comum</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {newRole === 'admin' && 'Administrador secundário com permissões configuráveis.'}
                {newRole === 'user' && 'Usuário comum sem permissões administrativas.'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeRole} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para configurar permissões */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Permissões do Administrador</DialogTitle>
            <DialogDescription>
              Configurar permissões de <strong>{selectedUser?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Editar Estabelecimentos</Label>
                <p className="text-xs text-muted-foreground">Criar e editar empresas</p>
              </div>
              <Switch
                checked={permissions.can_edit_establishments}
                onCheckedChange={(v) => setPermissions(p => ({ ...p, can_edit_establishments: v }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Aprovar Solicitações</Label>
                <p className="text-xs text-muted-foreground">Aprovar ou recusar cadastros</p>
              </div>
              <Switch
                checked={permissions.can_approve_requests}
                onCheckedChange={(v) => setPermissions(p => ({ ...p, can_approve_requests: v }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Gerenciar Propagandas</Label>
                <p className="text-xs text-muted-foreground">Criar e editar anúncios</p>
              </div>
              <Switch
                checked={permissions.can_manage_ads}
                onCheckedChange={(v) => setPermissions(p => ({ ...p, can_manage_ads: v }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Ver Conversas</Label>
                <p className="text-xs text-muted-foreground">Acessar chat de suporte</p>
              </div>
              <Switch
                checked={permissions.can_view_conversations}
                onCheckedChange={(v) => setPermissions(p => ({ ...p, can_view_conversations: v }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Gerenciar Usuários</Label>
                <p className="text-xs text-muted-foreground">Alterar roles de outros usuários</p>
              </div>
              <Switch
                checked={permissions.can_manage_users}
                onCheckedChange={(v) => setPermissions(p => ({ ...p, can_manage_users: v }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={permissions.notes}
                onChange={(e) => setPermissions(p => ({ ...p, notes: e.target.value }))}
                placeholder="Anotações sobre este administrador..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Permissões'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para excluir usuário */}
      <ConfirmPasswordDialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title="Excluir Usuário"
        description="Esta ação é irreversível. Todos os dados do usuário serão removidos permanentemente."
        actionLabel={deletingUser ? "Excluindo..." : "Excluir"}
        variant="destructive"
      />
    </>
  );
}