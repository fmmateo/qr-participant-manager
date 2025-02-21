
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate,
      design
    } = await req.json();

    console.log('Recibidos datos del certificado:', {
      name,
      email,
      certificateNumber,
      programName
    });

    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan datos requeridos para generar el certificado');
    }

    // Enviar el correo con el certificado
    const emailResponse = await resend.emails.send({
      from: 'Certificados <certificados@resend.dev>',
      to: [email],
      subject: `Tu certificado de ${programName}`,
      html: `
        <h1>¡Felicitaciones ${name}!</h1>
        <p>Adjunto encontrarás tu certificado de ${certificateType} para el programa ${programName}.</p>
        <p>Código de verificación: ${certificateNumber}</p>
        <hr>
        ${design.template_html.text}
      `,
    });

    console.log('Respuesta del envío de correo:', emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        id: emailResponse.id,
        certificateUrl: `https://example.com/certificates/${certificateNumber}`,
        verificationUrl: `https://example.com/verify/${certificateNumber}`
      }),
      {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error en generate-certificate:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
