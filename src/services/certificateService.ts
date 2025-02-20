
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
  const { data: existingCert, error: existingCertError } = await supabase
    .from('certificates')
    .select('*')
    .eq('participant_id', participant.id)
    .eq('program_name', program.name)
    .eq('certificate_type', certType)
    .maybeSingle();

  if (existingCertError) {
    console.error('Error al verificar certificado existente:', existingCertError);
    throw existingCertError;
  }

  if (existingCert) {
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
        body: emailPayload
      }
    );

    if (emailError || !emailResponse?.success) {
      throw new Error(emailError?.message || emailResponse?.error || 'Error al enviar el certificado');
    }

    // Actualizar el certificado con los datos de la respuesta
    await supabase
      .from('certificates')
      .update({
        sent_at: new Date().toISOString(),
        sent_email_status: 'SUCCESS',
        image_url: emailResponse.certificateUrl,
        verification_url: emailResponse.verificationUrl,
        external_id: emailResponse.id
      })
      .eq('certificate_number', certificateNumber);

    return emailResponse;

  } catch (error) {
    // Si falla el envío, actualizar el estado del certificado
    await supabase
      .from('certificates')
      .update({
        sent_email_status: 'ERROR',
        last_error: error.message,
        retry_count: 1
      })
      .eq('certificate_number', certificateNumber);

    throw error;
  }
};
