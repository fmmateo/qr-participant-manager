import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SIMPLECERT_API_KEY = Deno.env.get("SIMPLECERT_API_KEY");
const API_URL = "https://api.simplecert.net/v1";
const TEMPLATE_ID = Deno.env.get("TEMPLATE_ID") || "template_default"; // Ahora obtenemos el ID de las variables de entorno

// Datos específicos del proyecto
const PROJECT_INFO = {
  id: "231874",
  title: "Félix Mateo",
  type: "Certificado Cooperativa",
  organization: "Cooperativa Félix Mateo"
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateData {
  name: string;
  email: string;
  certificateNumber: string;
  certificateType: string;
  programName: string;
  programType: string;
  issueDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: CertificateData = await req.json();
    
    console.log('Iniciando generación de certificado para:', data.email);
    console.log('Proyecto:', PROJECT_INFO.id);
    
    const simpleCertPayload = {
      recipient: {
        name: data.name,
        email: data.email
      },
      template_id: TEMPLATE_ID,
      custom_fields: {
        certificate_number: `${PROJECT_INFO.id}-${data.certificateNumber}`,
        certificate_type: `Certificado de ${data.certificateType}`,
        program_name: data.programName,
        program_type: data.programType,
        issue_date: data.issueDate,
        project_id: PROJECT_INFO.id,
        project_title: PROJECT_INFO.title,
        organization: PROJECT_INFO.organization,
        signature_title: "Director Ejecutivo",
        signature_date: new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
      language: "es",
      send_email: true,
      email_message: `¡Felicitaciones ${data.name}!

Por medio de la presente, ${PROJECT_INFO.organization} hace constar que has completado exitosamente el programa "${data.programName}".

Este certificado de ${data.certificateType} se emite como reconocimiento a tu dedicación y compromiso dentro del proyecto "${PROJECT_INFO.title}" (ID: ${PROJECT_INFO.id}).

Número de Certificado: ${PROJECT_INFO.id}-${data.certificateNumber}
Fecha de Emisión: ${data.issueDate}

El certificado está adjunto a este correo. También puedes descargarlo usando el enlace proporcionado.

¡Felicitaciones por este logro!

Atentamente,
${PROJECT_INFO.organization}
Proyecto: ${PROJECT_INFO.title}`
    };

    console.log('Enviando solicitud a SimpleCert:', JSON.stringify(simpleCertPayload, null, 2));

    const response = await fetch(`${API_URL}/certificates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SIMPLECERT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(simpleCertPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error de SimpleCert:', error);
      throw new Error(error.message || 'Error al generar el certificado');
    }

    const result = await response.json();
    console.log('Respuesta exitosa de SimpleCert:', result);

    return new Response(
      JSON.stringify({
        success: true,
        certificateId: result.id,
        certificateUrl: result.pdf_url,
        verificationUrl: result.verification_url,
        projectInfo: PROJECT_INFO
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error en generate-certificate:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined,
        projectInfo: PROJECT_INFO
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
};

serve(handler);
