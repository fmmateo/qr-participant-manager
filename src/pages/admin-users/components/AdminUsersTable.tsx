
import { Shield, UserCog } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminUser } from "@/types/database";

interface AdminUserWithEmail extends Omit<AdminUser, 'user_id'> {
  email: string;
}

interface AdminUsersTableProps {
  adminUsers: AdminUserWithEmail[];
  onAdminUpdated: () => void;
}

export const AdminUsersTable = ({ adminUsers, onAdminUpdated }: AdminUsersTableProps) => {
  const { toast } = useToast();

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

      onAdminUpdated();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado del administrador",
        variant: "destructive",
      });
    }
  };

  return (
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
  );
};
