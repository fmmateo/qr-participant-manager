
import { supabase } from "@/integrations/supabase/client";
import type { Program, Template, Participant, CertificateDesign } from "@/components/certificates/types";

export const issueCertificate = async (
  participant: Participant,
  program: Program,
  certType: string,
  selectedTemplate: Template,
  design: CertificateDesign
) => {
  if (!participant || !participant.email) {
    throw new Error('Datos del participante inválidos');
  }

  if (!selectedTemplate?.id) {
    throw new Error('Debe seleccionar una plantilla de certificado válida');
  }

  if (!design?.id) {
    throw new Error('Debe seleccionar un diseño de certificado válido');
  }

  try {
    // Verificar si la plantilla está bloqueada o inactiva
    const { data: template, error: templateError } = await supabase
      .from('certificate_templates')
      .select('is_locked, is_active, template_url')
      .eq('id', selectedTemplate.id)
      .maybeSingle();

    if (templateError) {
      console.error('Error al verificar plantilla:', templateError);
      throw new Error('Error al verificar el estado de la plantilla');
    }

    if (!template) {
      throw new Error('La plantilla seleccionada no existe');
    }

    if (template.is_locked) {
      throw new Error('La plantilla seleccionada está bloqueada');
    }

    if (!template.is_active) {
      throw new Error('La plantilla seleccionada no está activa');
    }

    const certificateNumber = `CERT-${Date.now()}-${participant.id.slice(0, 8)}`;

    // Verificar certificado existente
    const { data: existingCert, error: existingError } = await supabase
      .from('certificates')
      .select()
      .eq('participant_id', participant.id)
      .eq('program_name', program.name)
      .eq('certificate_type', certType)
      .eq('sent_email_status', 'SUCCESS')
      .maybeSingle();

    if (existingError) {
      console.error('Error al verificar certificado existente:', existingError);
      throw new Error('Error al verificar certificado existente');
    }

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
      console.error('Error al crear certificado:', insertError);
      throw insertError;
    }

    // Formatear fecha en español
    const issueDate = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Construir payload para la función edge
    const payload = {
      name: participant.name,
      email: participant.email,
      certificateNumber,
      certificateType: certType,
      programType: program.type,
      programName: program.name,
      issueDate,
      templateId: selectedTemplate.id,
      templateUrl: template.template_url,
      design
    };

    console.log('Enviando payload a la función edge:', payload);

    // Generar certificado
    const { data: response, error: edgeFunctionError } = await supabase.functions.invoke(
      'generate-certificate',
      {
        body: payload
      }
    );

    console.log('Respuesta de la función edge:', response);

    if (edgeFunctionError) {
      console.error('Error en la función edge:', edgeFunctionError);
      
      await supabase
        .from('certificates')
        .update({
          sent_email_status: 'ERROR',
          last_error: edgeFunctionError.message,
          retry_count: 1
        })
        .eq('certificate_number', certificateNumber);
        
      throw new Error(`Error en la función edge: ${edgeFunctionError.message}`);
    }

    // Verificar respuesta
    if (!response || response.error) {
      const errorMessage = response?.error || 'Error desconocido al generar el certificado';
      console.error('Error en la generación del certificado:', errorMessage);
      
      await supabase
        .from('certificates')
        .update({
          sent_email_status: 'ERROR',
          last_error: errorMessage,
          retry_count: 1
        })
        .eq('certificate_number', certificateNumber);

      throw new Error(`Error al generar el certificado: ${errorMessage}`);
    }

    // Actualizar certificado con éxito
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        verification_url: response.verificationUrl,
        external_id: response.id,
        image_url: response.imageUrl
      })
      .eq('certificate_number', certificateNumber);

    if (updateError) {
      console.error('Error al actualizar el certificado:', updateError);
      throw new Error('Error al actualizar el estado del certificado');
    }

    // Enviar email automáticamente
    const { error: emailError } = await supabase.functions.invoke(
      'send-certificate-email',
      {
        body: { certificateNumber }
      }
    );

    if (emailError) {
      console.error('Error al enviar el email:', emailError);
      throw new Error('Error al enviar el email del certificado');
    }

    return response;

  } catch (error) {
    console.error('Error en el proceso de certificado:', error);
    throw error;
  }
};
