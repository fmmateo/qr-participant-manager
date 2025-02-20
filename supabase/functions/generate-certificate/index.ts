
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SIMPLECERT_API_KEY = Deno.env.get("SIMPLECERT_API_KEY");
const API_URL = "https://api.simplecert.net/v1";

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
    
    // Crear el certificado en SimpleCert
    const response = await fetch(`${API_URL}/certificates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SIMPLECERT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: {
          name: data.name,
          email: data.email
        },
        template_id: "template_default", // Usa el ID de tu template de SimpleCert
        custom_fields: {
          certificate_number: data.certificateNumber,
          certificate_type: data.certificateType,
          program_name: data.programName,
          program_type: data.programType,
          issue_date: data.issueDate
        },
        language: "es",
        send_email: true,
        email_message: `¡Felicitaciones ${data.name}! Has recibido tu certificado de ${data.certificateType} para el programa ${data.programName}.`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al generar el certificado');
    }

    const result = await response.json();

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
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
};

serve(handler);
