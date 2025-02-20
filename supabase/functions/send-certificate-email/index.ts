
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar claves API
    const SIMPLECERT_API_KEY = Deno.env.get('SIMPLECERT_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SIMPLECERT_API_KEY || !RESEND_API_KEY) {
      console.error('Faltan claves API');
      throw new Error('Error de configuración: Faltan claves API necesarias');
    }

    // Obtener y validar payload
    const payload = await req.json();
    console.log('Payload recibido:', payload);

    const {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate,
      templateId, // Ahora usamos el ID directamente
      templateUrl
    } = payload;

    if (!email || !name || !certificateNumber || !programName || !templateId) {
      throw new Error('Faltan campos requeridos en el payload');
    }

    // Generar certificado en SimpleCert
    const simpleCertPayload = {
      template_id: templateId,
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
      console.error('Error de SimpleCert:', {
        status: simpleCertResponse.status,
        body: errorText
      });
      throw new Error(`Error de SimpleCert: ${errorText}`);
    }

    const certificateData = await simpleCertResponse.json();
    console.log('Respuesta de SimpleCert:', certificateData);

    if (!certificateData.pdf_url) {
      throw new Error('No se recibió URL del certificado de SimpleCert');
    }

    // Enviar email con Resend
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

    console.log('Respuesta de Resend:', emailResult);

    // Retornar respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Certificado enviado correctamente',
        certificateUrl: certificateData.pdf_url,
        verificationUrl: certificateData.verification_url,
        id: certificateData.id,
        emailId: emailResult.id,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error en send-certificate-email:', error);
    
    // Retornar error con formato consistente
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
