
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Award } from "lucide-react";
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

const IssueCertificate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [certificateType, setCertificateType] = useState('');
  const [programType, setProgramType] = useState('');
  const [programName, setProgramName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Finding participant:', email);
      // Buscar el participante por email
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id, name')
        .eq('email', email)
        .single();

      if (participantError) {
        console.error('Error finding participant:', participantError);
        throw new Error('Participante no encontrado');
      }

      // Generar número de certificado único
      const certificateNumber = `CERT-${Date.now()}-${participant.id.slice(0, 8)}`;

      console.log('Creating certificate:', {
        participant_id: participant.id,
        certificate_type: certificateType,
        certificate_number: certificateNumber,
        program_type: programType,
        program_name: programName,
        issue_date: new Date().toISOString(),
      });

      // Emitir el certificado
      const { error: certificateError } = await supabase
        .from('certificates')
        .insert([
          {
            participant_id: participant.id,
            certificate_type: certificateType,
            certificate_number: certificateNumber,
            program_type: programType,
            program_name: programName,
            issue_date: new Date().toISOString(),
          }
        ]);

      if (certificateError) {
        console.error('Error creating certificate:', certificateError);
        throw certificateError;
      }

      console.log('Certificate created, sending email...');

      // Enviar el certificado por correo electrónico con el payload correcto
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-certificate-email', {
        body: {
          name: participant.name,
          email: email,
          certificateNumber,
          certificateType,
          programType,
          programName,
          issueDate: new Date().toLocaleDateString('es-ES'),
        },
      });

      if (emailError) {
        console.error('Error sending certificate email:', emailError);
        throw new Error('Error al enviar el correo electrónico');
      }

      console.log('Email response:', emailData);

      // Actualizar el estado de envío en la base de datos
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

      toast({
        title: "¡Éxito!",
        description: `Certificado emitido y enviado correctamente a ${participant.name}`,
      });

      // Limpiar el formulario
      setEmail('');
      setCertificateType('');
      setProgramType('');
      setProgramName('');
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
                <Label htmlFor="programType">Tipo de programa</Label>
                <Select
                  value={programType}
                  onValueChange={setProgramType}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de programa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="CURSO">Curso</SelectItem>
                      <SelectItem value="TALLER">Taller</SelectItem>
                      <SelectItem value="DIPLOMADO">Diplomado</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="programName">Nombre del programa</Label>
                <Input
                  id="programName"
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="Ej: Desarrollo Web Full Stack"
                  required
                />
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

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Emitir y Enviar Certificado'}
                <Award className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IssueCertificate;

