
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Program } from "@/types/program";

const Registration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registrationToken = searchParams.get('token');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isValidAccess, setIsValidAccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    programId: ''
  });

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (registrationToken) {
        setIsValidAccess(true);
        return;
      }

      if (session) {
        setIsAdmin(true);
        setIsValidAccess(true);
        return;
      }

      toast({
        title: "Acceso Denegado",
        description: "No tienes permiso para acceder a esta página",
        variant: "destructive",
      });
      navigate('/');
    };

    checkAccess();
  }, [registrationToken, navigate, toast]);

  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['active-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Program[];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAccess) return;
    setIsSubmitting(true);

    try {
      const qrCode = crypto.randomUUID();
      
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .upsert({
          name: formData.name,
          email: formData.email,
          qr_code: qrCode,
          status: 'active'
        }, {
          onConflict: 'email'
        })
        .select()
        .single();

      if (participantError) throw participantError;

      const { error: registrationError } = await supabase
        .from('registrations')
        .insert([{
          participant_id: participant.id,
          program_id: formData.programId,
          phone: formData.phone,
        }]);

      if (registrationError) throw registrationError;

      // Enviamos el email con el código QR
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

      // Actualizamos el estado del envío del QR
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

      // Enviamos el email de confirmación de registro
      const { error: emailError } = await supabase.functions.invoke('send-registration-email', {
        body: {
          name: formData.name,
          email: formData.email,
          programName: programs?.find(p => p.id === formData.programId)?.name
        },
      });

      if (emailError) {
        console.error('Error sending registration email:', emailError);
      }

      toast({
        title: "¡Inscripción exitosa!",
        description: "Te hemos enviado un correo de confirmación y tu código QR personal.",
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        programId: ''
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar la inscripción",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isValidAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-xl mx-auto space-y-8">
        {isAdmin && (
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/participants/list')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Button>
        )}

        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Nueva Inscripción</h1>
              <p className="text-muted-foreground">
                Completa el formulario para inscribirte en nuestros programas.
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
                <Label htmlFor="phone">Número de teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1234567890"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="program">Programa</Label>
                <Select
                  value={formData.programId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, programId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs?.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name} ({program.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || isLoadingPrograms}
              >
                {isSubmitting ? 'Procesando...' : 'Inscribirse'}
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
