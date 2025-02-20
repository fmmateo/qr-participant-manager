import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Send, Upload, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ParticipantData {
  name: string;
  email: string;
  role: string;
}

const Registration = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParticipantData[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await registerParticipant(formData);
      setFormData({ name: '', email: '', role: '' });
      toast({
        title: "¡Registro exitoso!",
        description: "Te hemos enviado un correo electrónico con tu código QR personal.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el registro",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerParticipant = async (participant: ParticipantData) => {
    const qrCode = crypto.randomUUID();
    
    const { data, error: participantError } = await supabase
      .from('participants')
      .upsert({
        name: participant.name,
        email: participant.email,
        qr_code: qrCode,
        status: 'active',
        role: participant.role
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (participantError) throw participantError;

    await supabase.functions.invoke('send-qr-email', {
      body: {
        name: participant.name,
        email: participant.email,
        qrCode: qrCode,
      },
    });

    await supabase
      .from('participants')
      .update({
        qr_sent_at: new Date().toISOString(),
        qr_sent_email_status: 'SENT'
      })
      .eq('id', data.id);

    return data;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      setParsedData([]);
      return;
    }

    setCsvFile(file);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const participants = results.data as ParticipantData[];
        if (participants.length > 1000) {
          toast({
            title: "Error",
            description: "El archivo excede el límite de 1,000 participantes",
            variant: "destructive",
          });
          setCsvFile(null);
          setParsedData([]);
          event.target.value = '';
          return;
        }
        setParsedData(participants);
      },
      error: (error) => {
        toast({
          title: "Error",
          description: `Error al procesar el archivo: ${error.message}`,
          variant: "destructive",
        });
        setCsvFile(null);
        setParsedData([]);
        event.target.value = '';
      },
    });
  };

  const handleBulkUpload = async () => {
    if (!csvFile || parsedData.length === 0) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un archivo CSV válido",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let processedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (const participant of parsedData) {
        try {
          await registerParticipant(participant);
          processedCount++;
        } catch (error) {
          console.error(`Error registrando a ${participant.email}:`, error);
          errorCount++;
          errors.push(`${participant.email}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      toast({
        title: "Proceso completado",
        description: `Se registraron ${processedCount} participantes exitosamente. ${errorCount} registros fallaron.`,
      });

      if (errors.length > 0) {
        console.error("Detalles de errores:", errors);
      }

      setCsvFile(null);
      setParsedData([]);
      const fileInput = document.getElementById('csv') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el archivo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Juan Pérez",
        email: "juan@ejemplo.com",
        role: "participant"
      }
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "plantilla_registro.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-xl mx-auto space-y-8">
        <Card className="p-6">
          <Tabs defaultValue="single" className="space-y-6">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="single">Registro Individual</TabsTrigger>
              <TabsTrigger value="bulk">Registro Masivo</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Registro Individual</h2>
                <p className="text-muted-foreground">
                  Registra un nuevo participante.
                </p>
              </div>

              <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="juan@ejemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="participant">Participante</SelectItem>
                      <SelectItem value="facilitator">Facilitador</SelectItem>
                      <SelectItem value="guest">Invitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Procesando...' : 'Registrarse'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Registro Masivo</h2>
                <p className="text-muted-foreground">
                  Carga un archivo CSV con hasta 1,000 participantes.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full"
                >
                  Descargar Plantilla CSV
                  <Download className="ml-2 h-4 w-4" />
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="csv">Archivo CSV</Label>
                  <Input
                    id="csv"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    disabled={isSubmitting}
                  />
                  {csvFile && (
                    <p className="text-sm text-green-600">
                      Archivo seleccionado: {csvFile.name} ({parsedData.length} participantes)
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    El archivo debe incluir columnas para: name, email, y role
                  </p>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleBulkUpload}
                  disabled={isSubmitting || !csvFile}
                >
                  {isSubmitting ? (
                    'Procesando...'
                  ) : (
                    <>
                      Registrar Participantes
                      <Upload className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Registration;
