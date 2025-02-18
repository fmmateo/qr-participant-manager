
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Shield, UserCog } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { AdminUser } from "@/types/database";

interface AuthUser {
  id: string;
  email?: string;
}

interface AdminUserWithEmail extends Omit<AdminUser, 'user_id'> {
  email: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUserWithEmail[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.rpc('fetch_admin_status');
      
      if (error) throw error;
      
      if (!data?.[0]?.is_super) {
        toast({
          title: "Acceso Denegado",
          description: "No tienes permisos de super administrador",
          variant: "destructive",
        });
        navigate("/participants/list");
        return;
      }

      setIsSuperAdmin(true);
      loadAdminUsers();
    } catch (error) {
      console.error('Error:', error);
      navigate("/participants/list");
    }
  };

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const { data: adminUsersData, error: adminError } = await supabase
        .from('admin_users')
        .select('*');

      if (adminError) throw adminError;
      
      if (!adminUsersData) {
        setAdminUsers([]);
        return;
      }

      const { data: authData } = await supabase.auth.admin.listUsers();
      const users = (authData?.users || []) as AuthUser[];

      const combinedData = adminUsersData.map(admin => ({
        id: admin.id,
        email: users.find(user => user.id === admin.user_id)?.email || 'Usuario no encontrado',
        is_super_admin: admin.is_super_admin,
        is_active: admin.is_active,
        created_at: admin.created_at,
        updated_at: admin.updated_at
      }));

      setAdminUsers(combinedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los administradores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newAdminEmail,
        password: newAdminPassword,
        email_confirm: true
      });

      if (authError) throw authError;

      const { error: adminError } = await supabase
        .from('admin_users')
        .insert([{
          user_id: authData.user.id,
          is_super_admin: false,
          is_active: true
        }]);

      if (adminError) throw adminError;

      toast({
        title: "¡Éxito!",
        description: "Administrador creado correctamente",
      });

      setDialogOpen(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      loadAdminUsers();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al crear el administrador",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (adminId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !isActive })
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: `Administrador ${isActive ? 'desactivado' : 'activado'} correctamente`,
      });

      loadAdminUsers();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado del administrador",
        variant: "destructive",
      });
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/participants/list")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold">Gestión de Administradores</h2>
              <p className="text-muted-foreground">
                Administra los usuarios con acceso al panel
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Administrador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Administrador</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin@ejemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAdmin}>
                    Crear Administrador
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <p>Cargando administradores...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Correo electrónico</TableHead>
                  <TableHead>Super Admin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.email}</TableCell>
                    <TableCell>
                      {admin.is_super_admin ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>{admin.is_active ? 'Activo' : 'Inactivo'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={admin.is_active}
                        onCheckedChange={() => handleToggleActive(admin.id, admin.is_active)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
