
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SIMPLECERT_API_KEY = Deno.env.get('SIMPLECERT_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SIMPLECERT_API_KEY || !RESEND_API_KEY) {
      throw new Error('Error de configuración: Faltan claves API necesarias');
    }

    let payload;
    try {
      const bodyText = await req.text();
      payload = JSON.parse(bodyText);
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

    // Extraer template_id de manera segura
    const template_id = templateUrl.split('/').find(part => part.length > 8);
    if (!template_id) {
      throw new Error('No se pudo extraer el ID del template de la URL: ' + templateUrl);
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

    let simpleCertResponse;
    try {
      simpleCertResponse = await fetch('https://api.simplecert.net/v1/certificates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SIMPLECERT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simpleCertPayload),
      });
    } catch (error) {
      console.error('Error en la petición a SimpleCert:', error);
      throw new Error(`Error de conexión con SimpleCert: ${error.message}`);
    }

    if (!simpleCertResponse.ok) {
      const errorText = await simpleCertResponse.text();
      console.error('SimpleCert error response:', errorText);
      throw new Error(`Error del servicio SimpleCert: ${errorText}`);
    }

    const certificateData = await simpleCertResponse.json();
    console.log('Respuesta de SimpleCert:', certificateData);

    if (!certificateData.pdf_url) {
      throw new Error('No se recibió la URL del certificado');
    }

    // Enviar el correo electrónico usando Resend
    const resend = new Resend(RESEND_API_KEY);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">¡Hola ${name}!</h1>
        <p>Te adjuntamos tu certificado de ${certificateType} para el ${programType}: ${programName}.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Número de certificado:</strong> ${certificateNumber}</p>
          <p><strong>Fecha de emisión:</strong> ${issueDate}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificateData.pdf_url}" 
             style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
             target="_blank">
            Ver certificado
          </a>
        </div>
        ${certificateData.verification_url ? `
          <div style="text-align: center; margin: 20px 0;">
            <p>Para verificar la autenticidad de tu certificado, haz clic aquí:</p>
            <a href="${certificateData.verification_url}" 
               style="background-color: #2196F3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;"
               target="_blank">
              Verificar certificado
            </a>
          </div>
        ` : ''}
        <p style="text-align: center; color: #666; margin-top: 30px;">Gracias por tu participación.</p>
      </div>
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
