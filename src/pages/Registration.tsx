
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const [formData, setFormData] = useState<ParticipantData>({
    name: '',
    email: '',
    role: ''
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
        name: participant.name.trim(),
        email: participant.email.toLowerCase().trim(),
        qr_code: qrCode,
        status: 'active',
        role: participant.role
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
                Registra un nuevo participante.
              </p>
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
        </Card>
      </div>
    </div>
  );
};

export default Registration;
