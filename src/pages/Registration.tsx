
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useQuery } from "@tanstack/react-query";
import type { Program } from "@/types/program";

const Registration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registrationToken = searchParams.get('token');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    programId: ''
  });

  useEffect(() => {
    // Verificar el token
    const validateToken = async () => {
      // En este ejemplo, verificamos si existe un token
      // En producción, deberías validar contra un token seguro generado
      if (!registrationToken) {
        toast({
          title: "Acceso Denegado",
          description: "No tienes permiso para acceder a esta página",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      setIsValidToken(true);
    };

    validateToken();
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
    if (!isValidToken) return;
    setIsSubmitting(true);

    try {
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .upsert({
          name: formData.name,
          email: formData.email,
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

      const { error: emailError } = await supabase.functions.invoke('send-registration-email', {
        body: {
          name: formData.name,
          email: formData.email,
          programName: programs?.find(p => p.id === formData.programId)?.name
        },
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
      }

      toast({
        title: "¡Inscripción exitosa!",
        description: "Te hemos enviado un correo de confirmación.",
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

  if (!isValidToken) {
    return null; // No mostrar nada mientras se valida el token
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-xl mx-auto space-y-8">
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
