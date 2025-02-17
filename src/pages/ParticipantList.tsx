
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
import { ArrowLeft, LogOut, Eye, Users2 } from "lucide-react";
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
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleUpdate = async (id: string, data: { name: string; email: string }) => {
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

      loadParticipants();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al actualizar el participante",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este participante?")) return;

    try {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Participante eliminado correctamente",
      });

      loadParticipants();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el participante",
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
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
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
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
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
                <AttendanceTable attendanceRecords={attendanceRecords} />
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ParticipantList;
