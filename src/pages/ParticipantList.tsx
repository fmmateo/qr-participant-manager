
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Pencil, Trash2, LogOut, Eye, Users2 } from "lucide-react";

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
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

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
          *,
          participant:participants (
            id,
            name,
            email
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

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    setFormData({
      name: participant.name,
      email: participant.email,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;

    try {
      const { error } = await supabase
        .from("participants")
        .update({
          name: formData.name,
          email: formData.email,
        })
        .eq("id", editingParticipant.id);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Participante actualizado correctamente",
      });

      setEditingParticipant(null);
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>{participant.name}</TableCell>
                        <TableCell>{participant.email}</TableCell>
                        <TableCell>
                          {new Date(participant.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(participant)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Participante</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="name">Nombre</Label>
                                  <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="email">Email</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                </div>
                                <Button type="submit" className="w-full">
                                  Actualizar
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(participant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Registro de Asistencia</h2>
              </div>

              {loading ? (
                <p>Cargando registros de asistencia...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participante</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Fecha de Sesión</TableHead>
                      <TableHead>Hora de Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.participant?.name}</TableCell>
                        <TableCell>{record.participant?.email}</TableCell>
                        <TableCell>
                          {new Date(record.session_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(record.attendance_time).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ParticipantList;
