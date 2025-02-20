
import { supabase } from "@/integrations/supabase/client";
import type { Program, Template, Participant } from "@/components/certificates/types";

export const issueCertificate = async (
  participant: Participant,
  program: Program,
  certType: string,
  selectedTemplate: Template
) => {
  if (!participant || !participant.email) {
    throw new Error('Datos del participante inválidos');
  }

  if (!selectedTemplate) {
    throw new Error('Debe seleccionar una plantilla de certificado');
  }

  const certificateNumber = `CERT-${Date.now()}-${participant.id.slice(0, 8)}`;

  try {
    // Limpiar certificados anteriores con error
    await supabase
      .from('certificates')
      .delete()
      .eq('participant_id', participant.id)
      .eq('program_name', program.name)
      .eq('certificate_type', certType)
      .neq('sent_email_status', 'SUCCESS');

    // Verificar certificado existente
    const { data: existingCert } = await supabase
      .from('certificates')
      .select()
      .eq('participant_id', participant.id)
      .eq('program_name', program.name)
      .eq('certificate_type', certType)
      .eq('sent_email_status', 'SUCCESS')
      .maybeSingle();

    if (existingCert) {
      throw new Error(`Ya existe un certificado de ${certType} para este programa`);
    }

    // Crear nuevo certificado
    const { data: newCertificate, error: insertError } = await supabase
      .from('certificates')
      .insert([
        {
          participant_id: participant.id,
          certificate_type: certType,
          certificate_number: certificateNumber,
          program_type: program.type,
          program_name: program.name,
          issue_date: new Date().toISOString(),
          template_id: selectedTemplate.id,
          sent_email_status: 'PENDING'
        }
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Construir payload para la función edge
    const emailPayload = {
      name: participant.name,
      email: participant.email,
      certificateNumber,
      certificateType: certType,
      programType: program.type,
      programName: program.name,
      issueDate: new Date().toLocaleDateString('es-ES'),
      templateId: selectedTemplate.id, // Enviamos el ID directamente
      templateUrl: selectedTemplate.template_url
    };

    // Llamar a la función edge
    const { data: response, error: edgeError } = await supabase.functions.invoke(
      'send-certificate-email',
      {
        body: emailPayload // Supabase serializa automáticamente
      }
    );

    if (edgeError || !response?.success) {
      await supabase
        .from('certificates')
        .update({
          sent_email_status: 'ERROR',
          last_error: edgeError?.message || response?.error || 'Error desconocido',
          retry_count: 1
        })
        .eq('certificate_number', certificateNumber);

      throw new Error(edgeError?.message || response?.error || 'Error al enviar el certificado');
    }

    // Actualizar certificado con éxito
    await supabase
      .from('certificates')
      .update({
        sent_at: new Date().toISOString(),
        sent_email_status: 'SUCCESS',
        image_url: response.certificateUrl,
        verification_url: response.verificationUrl,
        external_id: response.id
      })
      .eq('certificate_number', certificateNumber);

    return response;

  } catch (error) {
    console.error('Error en el proceso de certificado:', error);
    throw error;
  }
};
