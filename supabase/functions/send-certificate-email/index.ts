
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  name: string;
  email: string;
  certificateNumber: string;
  certificateType: string;
  programType: string;
  programName: string;
  issueDate: string;
  templateId: string;
  templateUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    console.log('Recibido payload:', payload);

    const emailResponse = await resend.emails.send({
      from: "Certificados <onboarding@resend.dev>",
      to: [payload.email],
      subject: `Tu certificado de ${payload.certificateType} - ${payload.programName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>¡Felicitaciones ${payload.name}!</h1>
          <p>Has recibido un certificado de ${payload.certificateType} para el programa:</p>
          <h2>${payload.programName}</h2>
          <p><strong>Tipo de programa:</strong> ${payload.programType}</p>
          <p><strong>Número de certificado:</strong> ${payload.certificateNumber}</p>
          <p><strong>Fecha de emisión:</strong> ${payload.issueDate}</p>
          <p>Puedes descargar tu certificado haciendo clic en el siguiente enlace:</p>
          <p><a href="${payload.templateUrl}" target="_blank">Descargar certificado</a></p>
          <hr>
          <p style="color: #666; font-size: 12px;">Este es un correo automático, por favor no responder.</p>
        </div>
      `,
    });

    console.log('Respuesta de Resend:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: emailResponse.id,
        certificateUrl: payload.templateUrl,
        verificationUrl: `https://verificar.certificados.com/${payload.certificateNumber}`
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error en la función edge:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
};

serve(handler);
