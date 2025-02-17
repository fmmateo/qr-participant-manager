
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, QrCode, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrScanner } from "@/components/attendance/QrScanner";
import { EmailForm } from "@/components/attendance/EmailForm";
import { registerAttendance } from "@/services/attendanceService";

const RecordAttendance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [qrError, setQrError] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  const handleAttendance = async (identifier: string) => {
    setIsSubmitting(true);
    try {
      const result = await registerAttendance(identifier, date);
      
      toast({
        title: result.status === 'success' ? "¡Asistencia registrada!" : "Asistencia ya registrada",
        description: result.message,
        variant: result.status === 'success' ? "default" : "default",
      });

      if (result.status === 'success') {
        setEmail('');
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleAttendance(email);
  };

  const handleQrScan = async (result: string) => {
    setIsScanning(false);
    setQrError('');
    
    await handleAttendance(result);
    setTimeout(() => setIsScanning(true), 2000);
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
                <QrScanner
                  onScan={handleQrScan}
                  isScanning={isScanning}
                  error={qrError}
                />
              </TabsContent>

              <TabsContent value="email">
                <EmailForm
                  email={email}
                  setEmail={setEmail}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
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
