
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

    // Clonar y actualizar el diseño con la información del participante
    const updatedDesignParams = JSON.parse(JSON.stringify(design.design_params));
    
    // Definir campos específicos para la plantilla
    if (typeof updatedDesignParams !== 'object') {
      throw new Error('Formato de diseño inválido');
    }

    // Definir interface para el mapeo de campos
    interface FieldMapping {
      [key: string]: [string, readonly string[]];
    }

    // Mapeo flexible de campos con variaciones comunes
    const fieldMappings: FieldMapping = {
      name: [participant.name, ['name', 'participant_name', 'full_name', 'nombre', 'participante'] as const],
      program: [program.name, ['title', 'program', 'course', 'programa', 'curso', 'titulo'] as const],
      type: [program.type, ['subtitle1', 'program_type', 'type', 'tipo'] as const],
      certType: [certType, ['subtitle2', 'certificate_type', 'cert_type', 'tipo_certificado'] as const],
      date: [new Date().toLocaleDateString('es-ES'), ['date', 'issue_date', 'fecha'] as const]
    };

    // Actualizar todos los campos que coincidan con las variaciones conocidas
    Object.keys(updatedDesignParams).forEach(key => {
      const lowerKey = key.toLowerCase();
      
      // Buscar coincidencias en nuestro mapeo de campos
      for (const [, [value, variations]] of Object.entries(fieldMappings)) {
        if (Array.isArray(variations) && variations.some(v => lowerKey.includes(v.toLowerCase()))) {
          if (updatedDesignParams[key] && typeof updatedDesignParams[key] === 'object') {
            if ('text' in updatedDesignParams[key]) {
              updatedDesignParams[key].text = value;
            }
          } else {
            updatedDesignParams[key] = value;
          }
        }
      }
    });

    console.log('Parámetros de diseño actualizados:', updatedDesignParams);

    // Construir payload para la función edge
    const emailPayload = {
      name: participant.name,
      email: participant.email,
      certificateNumber,
      certificateType: certType,
      programType: program.type,
      programName: program.name,
      issueDate: new Date().toLocaleDateString('es-ES'),
      templateId: selectedTemplate.id,
      templateUrl: template.template_url,
      design: updatedDesignParams
    };

    console.log('Enviando payload a la función edge:', emailPayload);

    // Llamar a la función edge
    const { data: response, error: edgeError } = await supabase.functions.invoke(
      'generate-certificate',
      {
        body: emailPayload
      }
    );

    console.log('Respuesta de la función edge:', response);

    if (edgeError || !response?.success) {
      const errorMessage = edgeError?.message || response?.error || 'Error desconocido';
      console.error('Error en la función edge:', errorMessage);
      
      await supabase
        .from('certificates')
        .update({
          sent_email_status: 'ERROR',
          last_error: errorMessage,
          retry_count: 1
        })
        .eq('certificate_number', certificateNumber);

      throw new Error(`Error al enviar el certificado: ${errorMessage}`);
    }

    // Actualizar certificado con éxito
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        sent_at: new Date().toISOString(),
        sent_email_status: 'SUCCESS',
        image_url: response.certificateUrl,
        verification_url: response.verificationUrl,
        external_id: response.id
      })
      .eq('certificate_number', certificateNumber);

    if (updateError) {
      console.error('Error al actualizar el certificado:', updateError);
      throw new Error('Error al actualizar el estado del certificado');
    }

    return response;

  } catch (error) {
    console.error('Error en el proceso de certificado:', error);
    throw error;
  }
};
