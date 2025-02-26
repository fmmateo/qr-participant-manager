import { supabase } from "@/integrations/supabase/client";
import type { Program, Template, Participant, CertificateDesign } from "@/components/certificates/types";
import html2canvas from 'html2canvas';

const generateCertificateHTML = (participant: Participant, program: Program, certType: string, issueDate: string, certificateNumber: string, design: CertificateDesign) => {
  const certificateTemplate = design.design_params.template_html?.text || '';
  
  // Crear un div temporal para manipular el HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = certificateTemplate;

  // Actualizar los valores en el template
  const logoImg = tempDiv.querySelector('#logoEmpresa') as HTMLImageElement;
  if (logoImg && design.design_params.logo_url?.url) {
    logoImg.src = design.design_params.logo_url.url;
  }

  // Actualizar firma del director
  const directorSignature = tempDiv.querySelector('#firmaDigital') as HTMLImageElement;
  if (directorSignature && design.design_params.signature_url?.url) {
    directorSignature.src = design.design_params.signature_url.url;
  }

  // Actualizar firma del expositor
  const speakerSignature = tempDiv.querySelector('#firmaSpeaker') as HTMLImageElement;
  if (speakerSignature && design.design_params.speaker_signature_url?.url) {
    speakerSignature.src = design.design_params.speaker_signature_url.url;
  }

  // Actualizar nombres
  const directorName = tempDiv.querySelector('#nombreDirector');
  if (directorName) {
    directorName.textContent = design.design_params.director_name;
  }

  const speakerName = tempDiv.querySelector('#nombreExpositor');
  if (speakerName) {
    speakerName.textContent = design.design_params.speaker_name;
  }

  // Actualizar datos del participante y programa
  const nombreParticipante = tempDiv.querySelector('#nombreParticipante');
  if (nombreParticipante) {
    nombreParticipante.textContent = participant.name;
  }

  const curso = tempDiv.querySelector('#curso');
  if (curso) {
    curso.textContent = program.name;
  }

  const fecha = tempDiv.querySelector('#fecha');
  if (fecha) {
    fecha.textContent = issueDate;
  }

  const codigoEmision = tempDiv.querySelector('#codigoEmision');
  if (codigoEmision) {
    codigoEmision.textContent = certificateNumber;
  }

  return tempDiv.innerHTML;
};

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

    // Generar HTML del certificado
    const certificateHTML = generateCertificateHTML(
      participant,
      program,
      certType,
      issueDate,
      certificateNumber,
      design
    );

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
      design,
      htmlContent: certificateHTML
    };

    console.log('Enviando payload a la función edge:', payload);

    // Llamar a la función edge
    const { data: response, error: edgeFunctionError } = await supabase.functions.invoke(
      'send-certificate-email',
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
        sent_at: new Date().toISOString(),
        sent_email_status: 'SUCCESS'
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
