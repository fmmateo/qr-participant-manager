
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, UserCheck, QrCode, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { QrReader } from "react-qr-reader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QrData {
  name: string;
  email: string;
  qrCode: string;
  timestamp: string;
}

const RecordAttendance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [qrError, setQrError] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerAttendance(email);
  };

  const registerAttendance = async (participantIdentifier: string) => {
    setIsSubmitting(true);
    try {
      console.log('Procesando identificador:', participantIdentifier);
      
      let searchQuery;
      
      try {
        // Intentar parsear el QR si es un JSON válido
        const qrData: QrData = JSON.parse(participantIdentifier);
        searchQuery = qrData.qrCode;
        console.log('Datos del QR:', qrData);
      } catch {
        // Si no es JSON válido, usar el identificador directamente (email)
        searchQuery = participantIdentifier;
      }
      
      // Buscar el participante
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id, name')
        .or(`email.eq."${searchQuery}",qr_code.eq."${searchQuery}"`)
        .single();

      if (participantError) {
        console.error('Error al buscar participante:', participantError);
        toast({
          title: "Error",
          description: "Participante no encontrado",
          variant: "destructive",
        });
        return;
      }

      console.log('Participante encontrado:', participant);

      // Verificar si ya existe un registro para esta fecha
      const { data: existingAttendance, error: checkError } = await supabase
        .from('attendance')
        .select('id, attendance_time')
        .eq('participant_id', participant.id)
        .eq('session_date', date.toISOString().split('T')[0])
        .maybeSingle();

      if (checkError) {
        console.error('Error al verificar asistencia existente:', checkError);
        throw checkError;
      }

      if (existingAttendance) {
        const attendanceTime = new Date(existingAttendance.attendance_time).toLocaleTimeString();
        toast({
          title: "Asistencia ya registrada",
          description: `${participant.name} ya registró asistencia hoy a las ${attendanceTime}`,
          variant: "default",
        });
        return;
      }

      // Registrar la nueva asistencia
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert([
          {
            participant_id: participant.id,
            session_date: date.toISOString().split('T')[0],
            attendance_time: new Date().toISOString(),
          }
        ]);

      if (attendanceError) {
        console.error('Error al registrar asistencia:', attendanceError);
        throw attendanceError;
      }

      toast({
        title: "¡Asistencia registrada!",
        description: `Se registró la asistencia de ${participant.name} correctamente.`,
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

  const handleQrScan = (result: any) => {
    if (!isScanning || !result) return;
    
    setIsScanning(false);
    setQrError('');
    
    registerAttendance(result.text).then(() => {
      // Reactivar el escáner después de un breve delay
      setTimeout(() => setIsScanning(true), 2000);
    });
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
                Escanea el código QR o ingresa el correo electrónico del participante.
              </p>
            </div>

            <Tabs defaultValue="qr" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">
                  <QrCode className="mr-2 h-4 w-4" />
                  Escanear QR
                </TabsTrigger>
                <TabsTrigger value="email">
                  <Mail className="mr-2 h-4 w-4" />
                  Correo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="space-y-4">
                <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg">
                  <QrReader
                    onResult={handleQrScan}
                    constraints={{ 
                      facingMode: 'environment',
                      aspectRatio: 1
                    }}
                    className="w-full h-full"
                    videoId="qr-video"
                  />
                </div>
                {qrError && (
                  <p className="text-destructive text-sm text-center">{qrError}</p>
                )}
              </TabsContent>

              <TabsContent value="email">
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
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Procesando...' : 'Registrar Asistencia'}
                    <UserCheck className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label>Fecha de sesión</Label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border mx-auto"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RecordAttendance;
