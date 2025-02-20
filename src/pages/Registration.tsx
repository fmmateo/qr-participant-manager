
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Send, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Papa from 'papaparse';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParticipantData {
  name: string;
  email: string;
  role: string;
  organization: string;
}

const validateParticipant = (participant: ParticipantData): string | null => {
  if (!participant.name?.trim()) return "El nombre es requerido";
  if (!participant.email?.trim()) return "El correo electrónico es requerido";
  if (!participant.email.includes('@')) return "El correo electrónico no es válido";
  if (!['participant', 'facilitator', 'guest'].includes(participant.role)) {
    return "El rol debe ser: participant, facilitator o guest";
  }
  return null;
};

const Registration = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ParticipantData>({
    name: '',
    email: '',
    role: '',
    organization: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationError = validateParticipant(formData);
    if (validationError) {
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await registerParticipant(formData);
      setFormData({ name: '', email: '', role: '', organization: '' });
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: async (results) => {
        const participants: ParticipantData[] = results.data
          .slice(1) // Skip header row
          .filter((row: any[]) => row.length >= 3) // Ensure row has required fields
          .map((row: any[]) => ({
            name: row[0]?.toString() || '',
            email: row[1]?.toString() || '',
            organization: row[2]?.toString() || '',
            role: 'participant' // Default role
          }));

        setIsSubmitting(true);
        let successCount = 0;
        let errorCount = 0;

        for (const participant of participants) {
          try {
            const validationError = validateParticipant(participant);
            if (validationError) {
              errorCount++;
              continue;
            }
            await registerParticipant(participant);
            successCount++;
          } catch (error) {
            console.error('Error registering participant:', error);
            errorCount++;
          }
        }

        toast({
          title: "Proceso completado",
          description: `Se registraron ${successCount} participantes exitosamente. ${errorCount} registros fallaron.`,
          variant: errorCount > 0 ? "destructive" : "default",
        });

        setIsSubmitting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      header: false,
      skipEmptyLines: true,
    });
  };

  const registerParticipant = async (participant: ParticipantData) => {
    const qrCode = crypto.randomUUID();
    
    const { data, error: participantError } = await supabase
      .from('participants')
      .upsert({
        name: participant.name.trim(),
        email: participant.email.toLowerCase().trim(),
        qr_code: qrCode,
        status: 'active',
        role: participant.role,
        organization: participant.organization.trim()
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (participantError) {
      if (participantError.code === '23505') {
        throw new Error("Este correo electrónico ya está registrado");
      }
      throw participantError;
    }

    try {
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

    } catch (error) {
      console.error('Error enviando email:', error);
      toast({
        title: "Advertencia",
        description: "El participante fue registrado pero hubo un problema al enviar el email",
        variant: "destructive",
      });
    }

    return data;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-xl mx-auto space-y-8">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Registro de Participante</h2>
              <p className="text-muted-foreground">
                Registra participantes de forma individual o masiva.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csvFile">Cargar lista de participantes (CSV)</Label>
                <div className="flex gap-4">
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  El archivo CSV debe contener las columnas: Nombre, Email, Organización
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O registra individualmente
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="organization">Cooperativa u Organización</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                    placeholder="Nombre de tu cooperativa u organización"
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
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Registration;
