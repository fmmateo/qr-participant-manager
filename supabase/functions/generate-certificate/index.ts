
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
    
    // Crear el certificado en SimpleCert
    const simpleCertPayload = {
      recipient: {
        name: data.name,
        email: data.email
      },
      template_id: TEMPLATE_ID,
      custom_fields: {
        certificate_number: data.certificateNumber,
        certificate_type: data.certificateType,
        program_name: data.programName,
        program_type: data.programType,
        issue_date: data.issueDate
      },
      language: "es",
      send_email: true,
      email_message: `¡Felicitaciones ${data.name}!

Has recibido tu certificado de ${data.certificateType} por tu participación en el programa "${data.programName}".

Puedes descargar tu certificado desde el enlace adjunto.

¡Gracias por tu participación!`
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
