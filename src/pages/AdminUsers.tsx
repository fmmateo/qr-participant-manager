
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, UserCog, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminUserWithEmail } from "@/types/database";
import type { User } from '@supabase/supabase-js';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUserWithEmail[]>([]);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const { data: adminUsersData, error: adminError } = await supabase
        .from('admin_users')
        .select('*');

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          navigate("/auth");
          return;
        }
        throw adminError;
      }

      if (!adminUsersData || adminUsersData.length === 0) {
        setAdminUsers([]);
        setLoading(false);
        return;
      }

      const userIds = adminUsersData.map(admin => admin.user_id);
      const uniqueUserIds = [...new Set(userIds)];
      
      const usersPromises = uniqueUserIds.map(async (userId) => {
        const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
        if (error) {
          console.error('Error fetching user:', error);
          return null;
        }
        return user;
      });

      const users = (await Promise.all(usersPromises)).filter((user): user is User => user !== null);

      const combinedData: AdminUserWithEmail[] = adminUsersData.map(admin => ({
        id: admin.id,
        is_super_admin: admin.is_super_admin,
        is_active: admin.is_active,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
        email: users.find(user => user.id === admin.user_id)?.email || 'Usuario no encontrado'
      }));

      setAdminUsers(combinedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No tienes permiso para ver esta información",
        variant: "destructive",
      });
      navigate("/participants/list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
        <div className="max-w-6xl mx-auto">
          <p>Cargando...</p>
        </div>
      </div>
    );
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
          </div>

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
                  <TableCell>{admin.email}</TableCell>
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
                      onCheckedChange={async () => {
                        try {
                          const { error } = await supabase
                            .from('admin_users')
                            .update({ is_active: !admin.is_active })
                            .eq('id', admin.id);

                          if (error) throw error;

                          loadAdminUsers();
                          toast({
                            title: "¡Éxito!",
                            description: `Estado actualizado correctamente`,
                          });
                        } catch (error) {
                          console.error('Error:', error);
                          toast({
                            title: "Error",
                            description: "Error al actualizar el estado",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
