
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileCheck, Download, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const GenerateCertificate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [generatedCertificateUrl, setGeneratedCertificateUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Obtener participantes con asistencia
  const { data: participantsWithAttendance } = useQuery({
    queryKey: ['participants-with-attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) throw error;

      // Filtrar participantes únicos y activos
      const uniqueParticipants = Array.from(
        new Map(
          data
            .filter(record => record.participants?.status === 'active')
            .map(record => [record.participant_id, record.participants])
        ).values()
      );

      return uniqueParticipants;
    }
  });

  // Obtener plantillas
  const { data: templates } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const selectedParticipant = participantsWithAttendance?.find(
    p => p?.id === selectedParticipantId
  );
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const generateCertificate = async () => {
    if (!selectedParticipant || !selectedTemplate) {
      toast({
        title: "Error",
        description: "Por favor selecciona un participante y una plantilla",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Usar APIFlash para generar el certificado
      const apiflashUrl = new URL('https://api.apiflash.com/v1/urltoimage');
      apiflashUrl.searchParams.append('access_key', Deno.env.get('APIFLASH_ACCESS_KEY') || '');
      apiflashUrl.searchParams.append('url', selectedTemplate.template_url);
      apiflashUrl.searchParams.append('format', 'jpeg');
      apiflashUrl.searchParams.append('quality', '100');
      apiflashUrl.searchParams.append('width', '1600');
      apiflashUrl.searchParams.append('height', '1200');
      
      // Agregar texto al certificado
      apiflashUrl.searchParams.append('text', selectedParticipant.name);
      apiflashUrl.searchParams.append('text_color', '#000000');
      apiflashUrl.searchParams.append('text_size', '48');
      apiflashUrl.searchParams.append('text_font', 'Arial');
      apiflashUrl.searchParams.append('text_position', 'center');

      const response = await fetch(apiflashUrl.toString());
      if (!response.ok) {
        throw new Error('Error al generar el certificado');
      }

      const data = await response.json();
      setGeneratedCertificateUrl(data.url);

      toast({
        title: "¡Éxito!",
        description: "Certificado generado correctamente",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al generar el certificado",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendCertificate = async () => {
    if (!selectedParticipant || !generatedCertificateUrl) return;

    setIsSending(true);
    try {
      const certificateNumber = `CERT-${Date.now()}-${selectedParticipant.id.slice(0, 8)}`;

      // Guardar el certificado en la base de datos
      const { error: certificateError } = await supabase
        .from('certificates')
        .insert([
          {
            participant_id: selectedParticipant.id,
            certificate_type: 'ASISTENCIA',
            certificate_number: certificateNumber,
            template_id: selectedTemplateId,
            program_name: 'Programa General',
            program_type: 'Curso',
          }
        ]);

      if (certificateError) throw certificateError;

      // Enviar el correo electrónico
      const { error: emailError } = await supabase.functions.invoke('send-certificate-email', {
        body: {
          name: selectedParticipant.name,
          email: selectedParticipant.email,
          certificateNumber,
          certificateType: 'ASISTENCIA',
          programType: 'Curso',
          programName: 'Programa General',
          issueDate: new Date().toLocaleDateString('es-ES'),
          templateUrl: generatedCertificateUrl,
        },
      });

      if (emailError) throw emailError;

      toast({
        title: "¡Éxito!",
        description: "Certificado enviado correctamente",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al enviar el certificado",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedCertificateUrl) return;

    try {
      const response = await fetch(generatedCertificateUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${selectedParticipant?.name}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error al descargar:', error);
      toast({
        title: "Error",
        description: "Error al descargar el certificado",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-4xl mx-auto space-y-8">
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
              <h1 className="text-3xl font-bold">Generador de Certificados</h1>
              <p className="text-muted-foreground">
                Genera certificados personalizados basados en plantillas y asistencia
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Participante</Label>
                <Select
                  value={selectedParticipantId}
                  onValueChange={setSelectedParticipantId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un participante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {participantsWithAttendance?.map((participant) => (
                        <SelectItem key={participant.id} value={participant.id}>
                          {participant.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plantilla</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una plantilla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full"
                onClick={generateCertificate}
                disabled={isGenerating || !selectedParticipantId || !selectedTemplateId}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Generar Certificado
                  </>
                )}
              </Button>
            </div>

            {generatedCertificateUrl && (
              <div className="space-y-4">
                <img 
                  src={generatedCertificateUrl} 
                  alt="Certificado generado" 
                  className="w-full rounded-lg shadow-lg"
                />

                <div className="flex gap-4">
                  <Button 
                    className="flex-1"
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>

                  <Button 
                    className="flex-1"
                    onClick={sendCertificate}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar por Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GenerateCertificate;
