
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { CreateAdminDialog } from "./components/CreateAdminDialog";
import { AdminUsersTable } from "./components/AdminUsersTable";
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
            <CreateAdminDialog onAdminCreated={loadAdminUsers} />
          </div>

          <AdminUsersTable 
            adminUsers={adminUsers}
            onAdminUpdated={loadAdminUsers}
          />
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;
