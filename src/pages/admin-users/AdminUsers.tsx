
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

interface AdminUser {
  id: string;
  email: string;
  is_super_admin: boolean;
  is_active: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const loadAdminUsers = async () => {
    try {
      const { data: adminUsersData, error } = await supabase
        .from('admin_users')
        .select('*');

      if (error) throw error;

      // Aquí mapearíamos los datos con la información de usuarios
      setAdminUsers(adminUsersData || []);
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

  useEffect(() => {
    loadAdminUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/participants/list")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Gestión de Administradores</h2>
          </div>

          {loading ? (
            <p>Cargando...</p>
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
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
