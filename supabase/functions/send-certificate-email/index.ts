
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const SIMPLECERT_API_KEY = Deno.env.get('SIMPLECERT_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SIMPLECERT_API_KEY || !RESEND_API_KEY) {
      throw new Error('Error de configuración: Faltan claves API necesarias');
    }

    let payload;
    try {
      const rawBody = await req.text();
      payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
      console.log('Payload recibido:', payload);
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request payload');
    }

    const {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate,
      templateUrl,
    } = payload;

    if (!email || !name || !certificateNumber || !programName || !templateUrl) {
      throw new Error('Faltan campos requeridos en el payload');
    }

    // Crear el certificado en SimpleCert
    const template_id = templateUrl.split('/').pop()?.split('.')[0];
    if (!template_id) {
      throw new Error('URL de template inválida');
    }

    console.log('Template ID extraído:', template_id);

    const simpleCertPayload = {
      template_id,
      recipient: {
        name,
        email,
      },
      metadata: {
        certificate_number: certificateNumber,
        program_name: programName,
        program_type: programType,
        certificate_type: certificateType,
        issue_date: issueDate,
      },
      send_email: false,
    };

    console.log('Enviando petición a SimpleCert:', simpleCertPayload);

    const simpleCertResponse = await fetch('https://api.simplecert.net/v1/certificates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SIMPLECERT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simpleCertPayload),
    });

    if (!simpleCertResponse.ok) {
      const errorText = await simpleCertResponse.text();
      console.error('SimpleCert error response:', errorText);
      throw new Error(`Error generando certificado: ${errorText}`);
    }

    let certificateData;
    try {
      certificateData = await simpleCertResponse.json();
    } catch (error) {
      console.error('Error parsing SimpleCert response:', error);
      throw new Error('Invalid response from SimpleCert');
    }

    if (!certificateData.pdf_url) {
      throw new Error('No se recibió URL del certificado');
    }

    // Enviar el correo electrónico usando Resend
    const resend = new Resend(RESEND_API_KEY);
    
    const emailHtml = `
      <h1>¡Hola ${name}!</h1>
      <p>Te adjuntamos tu certificado de ${certificateType} para el ${programType}: ${programName}.</p>
      <p>Número de certificado: ${certificateNumber}</p>
      <p>Fecha de emisión: ${issueDate}</p>
      <p>Puedes acceder a tu certificado en el siguiente enlace:</p>
      <p><a href="${certificateData.pdf_url}" target="_blank">Ver certificado</a></p>
      ${certificateData.verification_url ? `
        <p>También puedes verificar la autenticidad de tu certificado en:</p>
        <p><a href="${certificateData.verification_url}" target="_blank">Verificar certificado</a></p>
      ` : ''}
      <p>Gracias por tu participación.</p>
    `;

    console.log('Enviando email a:', email);
    
    const emailResult = await resend.emails.send({
      from: 'CONAPCOOP <certificados@resend.dev>',
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programName}`,
      html: emailHtml,
    });

    console.log('Email enviado exitosamente:', emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Certificado enviado correctamente',
        certificateUrl: certificateData.pdf_url,
        verificationUrl: certificateData.verification_url,
        id: certificateData.id,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error en send-certificate-email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 400,
      }
    );
  }
});
