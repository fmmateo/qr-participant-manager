
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Award, SendHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const IssueCertificate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Consulta para obtener los programas
  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Obtener el programa seleccionado
  const selectedProgram = programs?.find(p => p.id === selectedProgramId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selectedProgram) {
      toast({
        title: "Error",
        description: "Por favor selecciona un programa válido",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Finding participant:', email);
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id, name')
        .eq('email', email)
        .single();

      if (participantError) {
        console.error('Error finding participant:', participantError);
        throw new Error('Participante no encontrado');
      }

      await issueCertificate(participant, selectedProgram, certificateType);

      toast({
        title: "¡Éxito!",
        description: `Certificado emitido y enviado correctamente a ${participant.name}`,
      });

      setEmail('');
      setCertificateType('');
      setSelectedProgramId('');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al emitir certificado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const issueCertificate = async (participant: any, program: any, certType: string) => {
    const certificateNumber = `CERT-${Date.now()}-${participant.id.slice(0, 8)}`;

    console.log('Creating certificate:', {
      participant_id: participant.id,
      certificate_type: certType,
      certificate_number: certificateNumber,
      program_type: program.type,
      program_name: program.name,
      issue_date: new Date().toISOString(),
    });

    const { error: certificateError } = await supabase
      .from('certificates')
      .insert([
        {
          participant_id: participant.id,
          certificate_type: certType,
          certificate_number: certificateNumber,
          program_type: program.type,
          program_name: program.name,
          issue_date: new Date().toISOString(),
        }
      ]);

    if (certificateError) {
      console.error('Error creating certificate:', certificateError);
      throw certificateError;
    }

    console.log('Certificate created, sending email...');

    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-certificate-email', {
      body: {
        name: participant.name,
        email: participant.email,
        certificateNumber,
        certificateType: certType,
        programType: program.type,
        programName: program.name,
        issueDate: new Date().toLocaleDateString('es-ES'),
      },
    });

    if (emailError) {
      console.error('Error sending certificate email:', emailError);
      throw new Error('Error al enviar el correo electrónico');
    }

    console.log('Email response:', emailData);

    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        sent_at: new Date().toISOString(),
        sent_email_status: 'SUCCESS',
      })
      .eq('certificate_number', certificateNumber);

    if (updateError) {
      console.error('Error updating certificate status:', updateError);
    }
  };

  const handleBulkSend = async () => {
    if (!selectedProgram || !certificateType) {
      toast({
        title: "Error",
        description: "Por favor selecciona un programa y tipo de certificado",
        variant: "destructive",
      });
      return;
    }

    setIsSendingBulk(true);
    try {
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('status', 'active');

      if (participantsError) throw participantsError;

      let successCount = 0;
      let errorCount = 0;

      for (const participant of participants) {
        try {
          await issueCertificate(participant, selectedProgram, certificateType);
          successCount++;
        } catch (error) {
          console.error(`Error sending certificate to ${participant.email}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Proceso completado",
        description: `${successCount} certificados enviados exitosamente${errorCount > 0 ? `, ${errorCount} errores` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

      setSelectedProgramId('');
      setCertificateType('');
    } catch (error) {
      console.error('Error in bulk send:', error);
      toast({
        title: "Error",
        description: "Error al enviar certificados masivamente",
        variant: "destructive",
      });
    } finally {
      setIsSendingBulk(false);
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
              <h1 className="text-3xl font-bold">Emitir Certificado</h1>
              <p className="text-muted-foreground">
                Genera y envía un certificado para un participante.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico del participante</Label>
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
                <Label htmlFor="program">Programa</Label>
                <Select
                  value={selectedProgramId}
                  onValueChange={setSelectedProgramId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un programa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {isLoadingPrograms ? (
                        <SelectItem value="loading" disabled>
                          Cargando programas...
                        </SelectItem>
                      ) : (
                        programs?.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name} ({program.type})
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateType">Tipo de certificado</Label>
                <Select
                  value={certificateType}
                  onValueChange={setCertificateType}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="PARTICIPACION">Participación</SelectItem>
                      <SelectItem value="APROBACION">Aprobación</SelectItem>
                      <SelectItem value="ASISTENCIA">Asistencia</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || !selectedProgram}
                >
                  {isSubmitting ? 'Procesando...' : 'Emitir y Enviar Certificado'}
                  <Award className="ml-2 h-4 w-4" />
                </Button>

                <Button 
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={isSendingBulk || !selectedProgram || !certificateType}
                  onClick={handleBulkSend}
                >
                  {isSendingBulk ? 'Procesando...' : 'Enviar a Todos los Participantes'}
                  <SendHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IssueCertificate;

