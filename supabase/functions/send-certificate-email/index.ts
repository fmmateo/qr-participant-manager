
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CertificateEmailPayload {
  name: string
  email: string
  certificateNumber: string
  certificateType: string
  programType: string
  programName: string
  issueDate: string
  templateUrl: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as CertificateEmailPayload;
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

    // Validación de campos requeridos
    if (!email || !name || !certificateNumber || !programName || !templateUrl) {
      console.error('Campos faltantes:', { email, name, certificateNumber, programName, templateUrl });
      throw new Error('Faltan campos requeridos');
    }

    const SIMPLECERT_API_KEY = Deno.env.get('SIMPLECERT_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SIMPLECERT_API_KEY || !RESEND_API_KEY) {
      console.error('Claves API faltantes:', {
        hasSimpleCert: !!SIMPLECERT_API_KEY,
        hasResend: !!RESEND_API_KEY
      });
      throw new Error('Error de configuración: Faltan claves API necesarias');
    }

    // Extraer el ID del template de la URL
    // Ejemplo: si templateUrl es "https://dynapictures.com/app/w/2be624c9e3/template"
    // queremos extraer "2be624c9e3"
    const matches = templateUrl.match(/\/w\/([^/]+)/);
    const designId = matches ? matches[1] : null;

    console.log('Design ID extraído:', designId);

    if (!designId) {
      console.error('URL de template inválida:', templateUrl);
      throw new Error('URL de template inválida');
    }

    const certificatePayload = {
      template_id: designId,
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

    console.log('Enviando petición a SimpleCert:', certificatePayload);

    // Crear el certificado usando SimpleCert
    const simpleCertResponse = await fetch('https://api.simplecert.net/v1/certificates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SIMPLECERT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(certificatePayload),
    });

    console.log('Respuesta de SimpleCert - Status:', simpleCertResponse.status);
    
    if (!simpleCertResponse.ok) {
      const errorText = await simpleCertResponse.text();
      console.error('Error de SimpleCert:', {
        status: simpleCertResponse.status,
        statusText: simpleCertResponse.statusText,
        error: errorText
      });
      throw new Error(`Error al generar el certificado: ${errorText}`);
    }

    const certificateData = await simpleCertResponse.json();
    console.log('Datos del certificado generado:', certificateData);

    if (!certificateData.pdf_url) {
      console.error('Respuesta de SimpleCert sin URL del PDF:', certificateData);
      throw new Error('No se recibió URL del certificado generado');
    }

    const resend = new Resend(RESEND_API_KEY);
    
    const emailContent = `
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

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'CONAPCOOP <certificados@resend.dev>',
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programName}`,
      html: emailContent,
    });

    if (emailError) {
      console.error('Error al enviar email:', emailError);
      throw emailError;
    }

    console.log('Email enviado exitosamente:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Certificado enviado correctamente',
        data: emailData,
        id: certificateData.id,
        certificateUrl: certificateData.pdf_url,
        verificationUrl: certificateData.verification_url
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})
