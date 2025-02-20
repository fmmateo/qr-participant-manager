
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

  // Verificar si ya existe un certificado
  const { data: existingCerts, error: existingCertError } = await supabase
    .from('certificates')
    .select('*')
    .eq('participant_id', participant.id)
    .eq('program_name', program.name)
    .eq('certificate_type', certType);

  if (existingCertError) {
    console.error('Error al verificar certificado existente:', existingCertError);
    throw existingCertError;
  }

  if (existingCerts && existingCerts.length > 0) {
    throw new Error(`Ya existe un certificado de ${certType} para este programa`);
  }

  // Crear el certificado en la base de datos
  const { data: certificate, error: certificateError } = await supabase
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
      }
    ])
    .select()
    .single();

  if (certificateError) {
    console.error('Error creating certificate:', certificateError);
    throw certificateError;
  }

  try {
    const emailPayload = {
      name: participant.name,
      email: participant.email,
      certificateNumber,
      certificateType: certType,
      programType: program.type,
      programName: program.name,
      issueDate: new Date().toLocaleDateString('es-ES'),
      templateUrl: selectedTemplate.template_url,
    };

    const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
      'send-certificate-email',
      {
        body: JSON.stringify(emailPayload)
      }
    );

    if (emailError) {
      console.error('Error invoking edge function:', emailError);
      throw emailError;
    }

    if (!emailResponse?.success) {
      console.error('Error response from edge function:', emailResponse);
      throw new Error(emailResponse?.error || 'Error al enviar el certificado');
    }

    // Actualizar el certificado con los datos de la respuesta
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        sent_at: new Date().toISOString(),
        sent_email_status: 'SUCCESS',
        image_url: emailResponse.certificateUrl,
        verification_url: emailResponse.verificationUrl,
        external_id: emailResponse.id
      })
      .eq('certificate_number', certificateNumber);

    if (updateError) {
      console.error('Error updating certificate:', updateError);
    }

    return emailResponse;

  } catch (error) {
    console.error('Error in certificate process:', error);
    // Si falla el envío, actualizar el estado del certificado
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        sent_email_status: 'ERROR',
        last_error: error.message || 'Error desconocido',
        retry_count: 1
      })
      .eq('certificate_number', certificateNumber);

    if (updateError) {
      console.error('Error updating certificate error status:', updateError);
    }

    throw error;
  }
};
