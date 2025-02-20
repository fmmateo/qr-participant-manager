
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SIMPLECERT_API_KEY = Deno.env.get("SIMPLECERT_API_KEY");
const API_URL = "https://api.simplecert.net/v1";
const TEMPLATE_ID = "template_default"; // Reemplaza esto con tu ID de plantilla

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
    
    const simpleCertPayload = {
      recipient: {
        name: data.name,
        email: data.email
      },
      template_id: TEMPLATE_ID,
      custom_fields: {
        certificate_number: data.certificateNumber,
        certificate_type: `Certificado de ${data.certificateType}`,
        program_name: data.programName,
        program_type: data.programType,
        issue_date: data.issueDate,
        // Campos adicionales específicos para cooperativa
        organization: "Cooperativa",
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

Por medio de la presente, hacemos constar que has completado exitosamente el programa "${data.programName}" en nuestra cooperativa.

Este certificado de ${data.certificateType} se emite como reconocimiento a tu dedicación y compromiso.

Número de Certificado: ${data.certificateNumber}
Fecha de Emisión: ${data.issueDate}

El certificado está adjunto a este correo. También puedes descargarlo usando el enlace proporcionado.

¡Felicitaciones por este logro!

Atentamente,
Cooperativa`
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
        verificationUrl: result.verification_url
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
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
};

serve(handler);
