
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";

const RecordAttendance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Primero, buscar el participante por email
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('email', email)
        .single();

      if (participantError) throw new Error('Participante no encontrado');

      // Registrar la asistencia
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert([
          {
            participant_id: participant.id,
            session_date: date.toISOString().split('T')[0],
          }
        ]);

      if (attendanceError) {
        if (attendanceError.code === '23505') { // Código de error de duplicado
          throw new Error('Ya se registró la asistencia para este participante en esta fecha');
        }
        throw attendanceError;
      }

      toast({
        title: "¡Éxito!",
        description: "Asistencia registrada correctamente.",
      });

      // Limpiar el formulario
      setEmail('');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al registrar asistencia",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-xl mx-auto space-y-8 animate-in">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card className="p-6 glass-card">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Registrar Asistencia</h1>
              <p className="text-muted-foreground">
                Ingresa el correo electrónico del participante para registrar su asistencia.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="participante@ejemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de sesión</Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  className="rounded-md border"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Registrar Asistencia'}
                <UserCheck className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RecordAttendance;
