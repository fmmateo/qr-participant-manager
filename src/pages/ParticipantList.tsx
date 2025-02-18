import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, LogOut, Eye, Users2, UserCheck, BookOpen, Trash, UserCog } from "lucide-react";
import { ParticipantTable } from "@/components/participants/ParticipantTable";
import { AttendanceTable } from "@/components/participants/AttendanceTable";
import type { Participant, AttendanceRecord } from "@/components/attendance/types";

const ParticipantList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const checkSuperAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setIsSuperAdmin(data?.is_super_admin || false);
    }
  };

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los participantes",
        variant: "destructive",
      });
    }
  };

  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          participant_id,
          session_date,
          attendance_time,
          status,
          created_at,
          updated_at,
          participant:participants (
            id,
            name,
            email,
            qr_code,
            status,
            created_at,
            updated_at
          )
        `)
        .order("session_date", { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros de asistencia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    checkSuperAdmin();
    loadParticipants();
    loadAttendance();

    const participantsChannel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants'
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    const attendanceChannel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        () => {
          loadAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteAllParticipants = async () => {
    if (!confirm("¿Estás seguro de eliminar TODOS los participantes? Esta acción no se puede deshacer y eliminará también todos los registros asociados.")) return;
    
    // Segunda confirmación para evitar eliminaciones accidentales
    if (!confirm("¡ADVERTENCIA! Esta acción eliminará permanentemente todos los participantes y sus registros. ¿Estás completamente seguro?")) return;

    try {
      // Primero eliminamos los registros de asistencia
      const { error: attendanceError } = await supabase
        .from("attendance")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Elimina todos los registros

      if (attendanceError) throw attendanceError;

      // Luego eliminamos los registros de inscripción
      const { error: registrationsError } = await supabase
        .from("registrations")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (registrationsError) throw registrationsError;

      // Finalmente eliminamos los participantes
      const { error: participantsError } = await supabase
        .from("participants")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (participantsError) throw participantsError;

      toast({
        title: "¡Éxito!",
        description: "Todos los participantes y sus registros han sido eliminados correctamente",
      });

      // Recargamos las listas
      loadParticipants();
      loadAttendance();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al eliminar los participantes y sus registros",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllAttendance = async () => {
    if (!confirm("¿Estás seguro de eliminar TODOS los registros de asistencia? Esta acción no se puede deshacer.")) return;
    
    // Segunda confirmación para evitar eliminaciones accidentales
    if (!confirm("¡ADVERTENCIA! Esta acción eliminará permanentemente todos los registros de asistencia. ¿Estás completamente seguro?")) return;

    try {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Todos los registros de asistencia han sido eliminados correctamente",
      });

      // Recargamos la lista de asistencia
      loadAttendance();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al eliminar los registros de asistencia",
        variant: "destructive",
      });
    }
  };

  const handleUpdateParticipant = async (id: string, data: { name: string; email: string }) => {
    try {
      const { error } = await supabase
        .from("participants")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Participante actualizado correctamente",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al actualizar el participante",
        variant: "destructive",
      });
    }
  };

  const handleDeleteParticipant = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este participante? Esto también eliminará todos sus registros asociados.")) return;

    try {
      const { error: registrationsError } = await supabase
        .from("registrations")
        .delete()
        .eq("participant_id", id);

      if (registrationsError) throw registrationsError;

      const { error: participantError } = await supabase
        .from("participants")
        .delete()
        .eq("id", id);

      if (participantError) throw participantError;

      toast({
        title: "¡Éxito!",
        description: "Participante y sus registros eliminados correctamente",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el participante",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAttendance = async (id: string, data: { session_date: string; attendance_time: string; status: string }) => {
    try {
      const attendance_time = new Date(`${data.session_date}T${data.attendance_time}`).toISOString();
      
      const { error } = await supabase
        .from("attendance")
        .update({
          session_date: data.session_date,
          attendance_time,
          status: data.status
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Registro de asistencia actualizado correctamente",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al actualizar el registro de asistencia",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este registro de asistencia?")) return;

    try {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Registro de asistencia eliminado correctamente",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el registro de asistencia",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              onClick={() => navigate("/registration")}
              className="bg-primary"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Nueva Inscripción
            </Button>
            {isSuperAdmin && (
              <Button 
                variant="default" 
                onClick={() => navigate("/admin-users")}
                className="bg-primary"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Gestionar Admins
              </Button>
            )}
            <Button 
              variant="default" 
              onClick={() => navigate("/programs")}
              className="bg-primary"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Gestionar Programas
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="participants" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="participants">
                <Users2 className="mr-2 h-4 w-4" />
                Participantes
              </TabsTrigger>
              <TabsTrigger value="attendance">
                <Eye className="mr-2 h-4 w-4" />
                Registro de Asistencia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participants" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Lista de Participantes</h2>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAllParticipants}
                  className="gap-2"
                >
                  <Trash className="h-4 w-4" />
                  Eliminar Todos
                </Button>
              </div>

              {loading ? (
                <p>Cargando participantes...</p>
              ) : (
                <ParticipantTable
                  participants={participants}
                  onUpdate={handleUpdateParticipant}
                  onDelete={handleDeleteParticipant}
                />
              )}
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Registro de Asistencia</h2>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAllAttendance}
                  className="gap-2"
                >
                  <Trash className="h-4 w-4" />
                  Eliminar Todos
                </Button>
              </div>

              {loading ? (
                <p>Cargando registros de asistencia...</p>
              ) : (
                <AttendanceTable
                  attendanceRecords={attendanceRecords}
                  onUpdate={handleUpdateAttendance}
                  onDelete={handleDeleteAttendance}
                />
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ParticipantList;
