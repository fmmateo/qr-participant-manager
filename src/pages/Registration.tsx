
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

const Registration = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const qrCode = crypto.randomUUID();
      
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .upsert({
          name: formData.name,
          email: formData.email,
          qr_code: qrCode,
          status: 'active',
          role: formData.role
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (participantError) throw participantError;

      const { error: qrEmailError } = await supabase.functions.invoke('send-qr-email', {
        body: {
          name: formData.name,
          email: formData.email,
          qrCode: qrCode,
        },
      });

      if (qrEmailError) {
        console.error('Error sending QR email:', qrEmailError);
        throw qrEmailError;
      }

      const { error: updateError } = await supabase
        .from('participants')
        .update({
          qr_sent_at: new Date().toISOString(),
          qr_sent_email_status: 'SENT'
        })
        .eq('id', participant.id);

      if (updateError) {
        console.error('Error updating QR sent status:', updateError);
      }

      toast({
        title: "¡Registro exitoso!",
        description: "Te hemos enviado un correo electrónico con tu código QR personal.",
      });

      setFormData({
        name: '',
        email: '',
        role: ''
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-xl mx-auto space-y-8">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Registro de Participante</h1>
              <p className="text-muted-foreground">
                Completa el formulario para registrarte.
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
