
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SIMPLECERT_API_KEY = Deno.env.get("SIMPLECERT_API_KEY");
const API_URL = "https://api.simplecert.net/v1";
const SITE_URL = "https://fmmateo98.simplecert.net";
const TEMPLATE_ID = Deno.env.get("TEMPLATE_ID");

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
    if (!TEMPLATE_ID) {
      console.error('Error: TEMPLATE_ID no está definido');
      throw new Error('TEMPLATE_ID no está definido');
    }

    if (!SIMPLECERT_API_KEY) {
      console.error('Error: SIMPLECERT_API_KEY no está definido');
      throw new Error('SIMPLECERT_API_KEY no está definido');
    }

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

    console.log('Configuración de SimpleCert:', {
      apiUrl: API_URL,
      templateId: TEMPLATE_ID,
      // No loggeamos el API key por seguridad
    });

    console.log('Enviando datos a SimpleCert:', certificateData);

    const response = await fetch(`${API_URL}/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SIMPLECERT_API_KEY}`
      },
      body: JSON.stringify(certificateData)
    });

    // Log de la respuesta HTTP
    console.log('Respuesta HTTP de SimpleCert:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Intentar obtener el texto de la respuesta primero
    const responseText = await response.text();
    console.log('Respuesta texto de SimpleCert:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Error al parsear la respuesta como JSON:', e);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Error de respuesta del servidor: ${responseText.substring(0, 200)}...`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!response.ok) {
      console.error('Error de SimpleCert:', result);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.message || 'Error al generar el certificado',
          details: result
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
        verificationUrl: `${SITE_URL}/verify/${result.id}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en el procesamiento:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
