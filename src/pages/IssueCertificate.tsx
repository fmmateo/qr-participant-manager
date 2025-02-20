
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { CertificateForm } from "@/components/certificates/CertificateForm";
import { BulkActions } from "@/components/certificates/BulkActions";
import { issueCertificate } from "@/services/certificateService";
import type { Program, Template, Participant, CertificateDesign } from "@/components/certificates/types";

const IssueCertificate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedDesignId, setSelectedDesignId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [isGeneratingFromAttendance, setIsGeneratingFromAttendance] = useState(false);

  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Program[];
    }
  });

  const { data: templates } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Template[];
    }
  });

  const selectedProgram = programs?.find(p => p.id === selectedProgramId);
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedTemplate || !selectedProgram || !certificateType || !selectedDesignId) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id, name, email')
        .eq('email', email)
        .single();

      if (participantError || !participant) {
        console.error('Error finding participant:', participantError);
        throw new Error('Participante no encontrado');
      }

      const { data: design, error: designError } = await supabase
        .from('certificate_designs')
        .select('*')
        .eq('id', selectedDesignId)
        .single();

      if (designError || !design) {
        throw new Error('Diseño de certificado no encontrado');
      }

      const emailResponse = await issueCertificate(
        participant as Participant,
        selectedProgram,
        certificateType,
        selectedTemplate,
        design as CertificateDesign
      );

      toast({
        title: "¡Éxito!",
        description: `Certificado emitido y enviado correctamente a ${participant.name}`,
      });

      setEmail('');
      setCertificateType('');
      setSelectedProgramId('');
      setSelectedTemplateId('');
      setSelectedDesignId('');
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

  const handleBulkSend = async () => {
    if (!selectedProgram || !certificateType || !selectedTemplate || !selectedDesignId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un programa, tipo de certificado, plantilla y diseño",
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

      if (!participants || participants.length === 0) {
        throw new Error('No hay participantes activos');
      }

      const { data: design, error: designError } = await supabase
        .from('certificate_designs')
        .select('*')
        .eq('id', selectedDesignId)
        .single();

      if (designError || !design) {
        throw new Error('Diseño de certificado no encontrado');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const participant of participants) {
        try {
          await issueCertificate(
            participant as Participant,
            selectedProgram,
            certificateType,
            selectedTemplate,
            design as CertificateDesign
          );
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
      setSelectedTemplateId('');
      setSelectedDesignId('');
    } catch (error) {
      console.error('Error in bulk send:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar certificados masivamente",
        variant: "destructive",
      });
    } finally {
      setIsSendingBulk(false);
    }
  };

  const handleGenerateFromAttendance = async () => {
    if (!selectedProgram || !certificateType || !selectedTemplate || !selectedDesignId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un programa, tipo de certificado, plantilla y diseño",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingFromAttendance(true);
    try {
      const { data: participantsWithAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          participant_id,
          participants (
            id,
            name,
            email,
            status
          )
        `)
        .eq('status', 'valid');

      if (attendanceError) throw attendanceError;

      const uniqueParticipants = Array.from(
        new Map(
          participantsWithAttendance
            .filter(record => record.participants?.status === 'active')
            .map(record => [record.participant_id, record.participants])
        ).values()
      );

      if (uniqueParticipants.length === 0) {
        toast({
          title: "Sin participantes",
          description: "No hay participantes con registros de asistencia válida",
          variant: "destructive",
        });
        return;
      }

      const { data: design, error: designError } = await supabase
        .from('certificate_designs')
        .select('*')
        .eq('id', selectedDesignId)
        .single();

      if (designError || !design) {
        throw new Error('Diseño de certificado no encontrado');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const participant of uniqueParticipants) {
        if (!participant) continue;
        
        try {
          await issueCertificate(
            participant as Participant,
            selectedProgram,
            certificateType,
            selectedTemplate,
            design as CertificateDesign
          );
          successCount++;
        } catch (error) {
          console.error(`Error generando certificado para ${participant.email}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Proceso completado",
        description: `${successCount} certificados generados exitosamente${errorCount > 0 ? `, ${errorCount} errores` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

      setSelectedProgramId('');
      setCertificateType('');
      setSelectedTemplateId('');
      setSelectedDesignId('');
    } catch (error) {
      console.error('Error en generación masiva:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar certificados masivamente",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFromAttendance(false);
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
                Genera y envía certificados para los participantes.
              </p>
            </div>

            <CertificateForm
              email={email}
              setEmail={setEmail}
              selectedProgramId={selectedProgramId}
              setSelectedProgramId={setSelectedProgramId}
              certificateType={certificateType}
              setCertificateType={setCertificateType}
              selectedTemplateId={selectedTemplateId}
              setSelectedTemplateId={setSelectedTemplateId}
              selectedDesignId={selectedDesignId}
              setSelectedDesignId={setSelectedDesignId}
              isSubmitting={isSubmitting}
              programs={programs}
              templates={templates}
              isLoadingPrograms={isLoadingPrograms}
              onSubmit={handleSubmit}
            />

            <BulkActions
              isSendingBulk={isSendingBulk}
              isGeneratingFromAttendance={isGeneratingFromAttendance}
              selectedProgramId={selectedProgramId}
              certificateType={certificateType}
              selectedTemplateId={selectedTemplateId}
              onBulkSend={handleBulkSend}
              onGenerateFromAttendance={handleGenerateFromAttendance}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IssueCertificate;
