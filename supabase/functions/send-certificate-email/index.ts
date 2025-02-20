
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      templateUrl,
    } = payload;

    if (!email || !name || !certificateNumber || !programName || !templateUrl) {
      throw new Error('Faltan campos requeridos');
    }

    const SIMPLECERT_API_KEY = Deno.env.get('SIMPLECERT_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SIMPLECERT_API_KEY || !RESEND_API_KEY) {
      throw new Error('Error de configuración: Faltan claves API necesarias');
    }

    // Nueva extracción del ID de la plantilla
    const templateId = templateUrl.split('/').pop()?.replace('/template', '') || null;
    if (!templateId) {
      throw new Error('URL de template inválida');
    }

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
        error: errorText
      });
      throw new Error(`Error al generar el certificado: ${errorText}`);
    }

    const certificateData = await simpleCertResponse.json();
    
    if (!certificateData.pdf_url) {
      throw new Error('No se recibió URL del certificado generado');
    }

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

    const emailData = await resend.emails.send({
      from: 'CONAPCOOP <certificados@resend.dev>',
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programName}`,
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Certificado enviado correctamente',
        certificateUrl: certificateData.pdf_url,
        verificationUrl: certificateData.verification_url,
        id: certificateData.id
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );

  } catch (error) {
    console.error('Error en send-certificate-email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error interno del servidor'
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
        status: 400,
      }
    );
  }
});
