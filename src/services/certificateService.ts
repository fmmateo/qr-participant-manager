
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
    // Primero, eliminar cualquier certificado previo con error
    const { error: deleteError } = await supabase
      .from('certificates')
      .delete()
      .eq('participant_id', participant.id)
      .eq('program_name', program.name)
      .eq('certificate_type', certType)
      .neq('sent_email_status', 'SUCCESS');

    if (deleteError) {
      console.error('Error limpiando certificados previos:', deleteError);
    }

    // Verificar si ya existe un certificado exitoso
    const { data: existingCert, error: existingCertError } = await supabase
      .from('certificates')
      .select('*')
      .eq('participant_id', participant.id)
      .eq('program_name', program.name)
      .eq('certificate_type', certType)
      .eq('sent_email_status', 'SUCCESS')
      .maybeSingle();

    if (existingCertError) {
      console.error('Error al verificar certificado existente:', existingCertError);
      throw existingCertError;
    }

    if (existingCert) {
      throw new Error(`Ya existe un certificado de ${certType} para este programa`);
    }

    // Crear el nuevo certificado
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
          sent_email_status: 'PENDING'
        }
      ])
      .select()
      .single();

    if (certificateError) {
      console.error('Error creating certificate:', certificateError);
      throw certificateError;
    }

    // Preparar y enviar el email
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

    console.log('Sending certificate email with payload:', emailPayload);

    const { data: emailResponse, error: emailError } = await supabase.functions.invoke(
      'send-certificate-email',
      {
        body: JSON.stringify(emailPayload),
      }
    );

    if (emailError) {
      console.error('Error calling edge function:', emailError);
      
      // Actualizar estado de error
      await supabase
        .from('certificates')
        .update({
          sent_email_status: 'ERROR',
          last_error: emailError.message,
          retry_count: 1
        })
        .eq('certificate_number', certificateNumber);

      throw new Error(`Error al enviar el correo: ${emailError.message}`);
    }

    if (!emailResponse?.success) {
      console.error('Edge function error:', emailResponse);
      
      // Actualizar estado de error
      await supabase
        .from('certificates')
        .update({
          sent_email_status: 'ERROR',
          last_error: emailResponse?.error || 'Error desconocido',
          retry_count: 1
        })
        .eq('certificate_number', certificateNumber);

      throw new Error(emailResponse?.error || 'Error al procesar el certificado');
    }

    // Actualizar el certificado con éxito
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
      console.error('Error updating certificate status:', updateError);
      throw updateError;
    }

    return emailResponse;

  } catch (error) {
    console.error('Error in certificate process:', error);
    throw error;
  }
};
