
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
import { ArrowLeft, LogOut, Eye, Users2, UserCheck, BookOpen } from "lucide-react";
import { ParticipantTable } from "@/components/participants/ParticipantTable";
import { AttendanceTable } from "@/components/participants/AttendanceTable";

interface Participant {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Attendance {
  id: string;
  participant_id: string;
  session_date: string;
  attendance_time: string;
  participant: Participant;
}

const ParticipantList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
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
          participant:participants (
            id,
            name,
            email,
            created_at
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
    loadParticipants();
    loadAttendance();

    // Suscribirse a cambios en tiempo real para participantes
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

    // Suscribirse a cambios en tiempo real para asistencias
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
      // Primero eliminamos los registros asociados
      const { error: registrationsError } = await supabase
        .from("registrations")
        .delete()
        .eq("participant_id", id);

      if (registrationsError) throw registrationsError;

      // Luego eliminamos el participante
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

  const handleUpdateAttendance = async (id: string, data: { session_date: string; attendance_time: string }) => {
    try {
      const attendance_time = new Date(`${data.session_date}T${data.attendance_time}`).toISOString();
      
      const { error } = await supabase
        .from("attendance")
        .update({
          session_date: data.session_date,
          attendance_time
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
