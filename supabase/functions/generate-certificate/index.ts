
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SIMPLECERT_API_KEY = Deno.env.get("SIMPLECERT_API_KEY");
const API_URL = "https://api.simplecert.net/v1";
const TEMPLATE_ID = Deno.env.get("TEMPLATE_ID") || "template_default"; // Ahora obtenemos el ID de las variables de entorno

// Datos específicos del proyecto
const PROJECT_INFO = {
  id: "231874",
  title: "Felix Mateo",
  type: "Certificado Cooperativa",
  organization: "Cooperativa Felix Mateo"
};

interface CertificatePayload {
  name: string;
  email: string;
  certificateNumber: string;
  certificateType: string;
  programName: string;
  programType: string;
  issueDate: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: CertificatePayload = await req.json();
    console.log('Procesando solicitud de certificado:', payload);

    const certificateData = {
      template_id: TEMPLATE_ID,
      recipient: {
        name: payload.name,
        email: payload.email,
      },
      custom_fields: {
        certificate_number: `${PROJECT_INFO.id}-${payload.certificateNumber}`,
        program_name: payload.programName,
        program_type: payload.programType,
        certificate_type: payload.certificateType,
        issue_date: payload.issueDate,
        organization: PROJECT_INFO.organization
      }
    };

    console.log('Enviando datos a SimpleCert:', certificateData);

    const response = await fetch(`${API_URL}/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SIMPLECERT_API_KEY}`
      },
      body: JSON.stringify(certificateData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Error de SimpleCert:', result);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.message || 'Error al generar el certificado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Respuesta exitosa de SimpleCert:', result);

    return new Response(
      JSON.stringify({
        success: true,
        certificateId: result.id,
        certificateUrl: result.pdf_url,
        verificationUrl: result.verification_url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en el procesamiento:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
