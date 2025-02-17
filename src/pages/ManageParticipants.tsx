
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, UserPlus, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const ManageParticipants = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<'individual' | 'list'>('individual');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    participantList: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingQR, setIsSendingQR] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (tab === 'individual') {
        console.log('Adding individual participant:', formData);
        
        if (!formData.email.includes('@')) {
          throw new Error('El correo electrónico no es válido');
        }

        const { data: existingParticipant, error: checkError } = await supabase
          .from('participants')
          .select('id')
          .eq('email', formData.email)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing participant:', checkError);
          throw new Error('Error al verificar el participante');
        }

        if (existingParticipant) {
          throw new Error('Ya existe un participante con este correo electrónico');
        }

        const newParticipant = {
          name: formData.name,
          email: formData.email,
          qr_code: crypto.randomUUID()
        };

        const { data, error } = await supabase
          .from('participants')
          .insert([newParticipant])
          .select()
          .single();

        if (error) {
          console.error('Error inserting participant:', error);
          throw new Error('Error al agregar el participante');
        }

        console.log('Participant added successfully:', data);

        try {
          const { error: emailError } = await supabase.functions.invoke('send-qr-email', {
            body: {
              name: data.name,
              email: data.email,
              qrCode: data.qr_code,
            },
          });

          if (emailError) throw emailError;

          await supabase
            .from('participants')
            .update({
              qr_sent_at: new Date().toISOString(),
              qr_sent_email_status: 'SENT'
            })
            .eq('id', data.id);

          toast({
            title: "¡Éxito!",
            description: "Participante agregado y QR enviado correctamente.",
          });
        } catch (emailError) {
          console.error('Error sending QR email:', emailError);
          toast({
            title: "Advertencia",
            description: "Participante agregado pero hubo un error al enviar el QR",
            variant: "destructive",
          });
        }

        setFormData(prev => ({
          ...prev,
          name: '',
          email: ''
        }));
      } else {
        const lines = formData.participantList
          .split('\n')
          .map(line => line.trim())
          .filter(line => line);

        if (lines.length === 0) {
          throw new Error('La lista está vacía');
        }

        const participants = lines.map(line => {
          const [name, email] = line.split(',').map(item => item.trim());
          if (!email || !email.includes('@')) {
            throw new Error(`Correo electrónico inválido en la línea: ${line}`);
          }
          return { 
            name, 
            email,
            qr_code: crypto.randomUUID()
          };
        });

        const emails = participants.map(p => p.email);
        const { data: existingParticipants, error: checkError } = await supabase
          .from('participants')
          .select('email')
          .in('email', emails);

        if (checkError) {
          console.error('Error checking existing participants:', checkError);
          throw new Error('Error al verificar participantes existentes');
        }

        if (existingParticipants && existingParticipants.length > 0) {
          const existingEmails = existingParticipants.map(p => p.email).join(', ');
          throw new Error(`Correos ya registrados: ${existingEmails}`);
        }

        const { data, error } = await supabase
          .from('participants')
          .insert(participants)
          .select();

        if (error) {
          console.error('Error inserting participants:', error);
          throw new Error('Error al agregar participantes');
        }

        let successCount = 0;
        let errorCount = 0;

        for (const participant of data) {
          try {
            await supabase.functions.invoke('send-qr-email', {
              body: {
                name: participant.name,
                email: participant.email,
                qrCode: participant.qr_code,
              },
            });

            await supabase
              .from('participants')
              .update({
                qr_sent_at: new Date().toISOString(),
                qr_sent_email_status: 'SENT'
              })
              .eq('id', participant.id);

            successCount++;
          } catch (emailError) {
            console.error('Error sending QR email:', emailError);
            errorCount++;
          }
        }

        toast({
          title: "Proceso completado",
          description: `${successCount} QRs enviados exitosamente${errorCount > 0 ? `, ${errorCount} errores` : ''}`,
          variant: errorCount > 0 ? "destructive" : "default",
        });

        setFormData(prev => ({
          ...prev,
          participantList: ''
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendQR = async (email: string) => {
    if (!email) return;
    
    setIsSendingQR(true);
    try {
      const { data: participant, error } = await supabase
        .from('participants')
        .select('name, email, qr_code')
        .eq('email', email)
        .single();

      if (error) throw error;

      const { error: emailError } = await supabase.functions.invoke('send-qr-email', {
        body: {
          name: participant.name,
          email: participant.email,
          qrCode: participant.qr_code,
        },
      });

      if (emailError) throw emailError;

      await supabase
        .from('participants')
        .update({
          qr_sent_at: new Date().toISOString(),
          qr_sent_email_status: 'SENT'
        })
        .eq('email', email);

      toast({
        title: "¡Éxito!",
        description: "Código QR reenviado correctamente.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al reenviar el código QR",
        variant: "destructive",
      });
    } finally {
      setIsSendingQR(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Gestionar Participantes</h1>
              <p className="text-muted-foreground">
                Agrega participantes y gestiona sus códigos QR.
              </p>
            </div>

            <div className="flex space-x-4 border-b pb-4">
              <Button
                variant={tab === 'individual' ? 'default' : 'ghost'}
                onClick={() => setTab('individual')}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Individual
              </Button>
              <Button
                variant={tab === 'list' ? 'default' : 'ghost'}
                onClick={() => setTab('list')}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar Lista
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'individual' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="juan@ejemplo.com"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleResendQR(formData.email)}
                        disabled={isSendingQR || !formData.email}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="participantList">Lista de participantes</Label>
                  <Textarea
                    id="participantList"
                    name="participantList"
                    value={formData.participantList}
                    onChange={handleInputChange}
                    placeholder="Nombre, Email&#10;Juan Pérez, juan@ejemplo.com&#10;María García, maria@ejemplo.com"
                    className="h-[200px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Formato: Nombre, Email (un participante por línea)
                  </p>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : tab === 'individual' ? 'Agregar Participante' : 'Importar Lista'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManageParticipants;
