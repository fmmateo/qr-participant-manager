
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as CertificateEmailPayload;
    console.log('Received request with payload:', payload);

    const {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate,
    } = payload;

    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan campos requeridos');
    }

    const SIMPLECERT_API_KEY = Deno.env.get('SIMPLECERT_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SIMPLECERT_API_KEY) {
      throw new Error('SIMPLECERT_API_KEY no está configurada');
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada');
    }

    console.log('Generating certificate for:', { name, email, certificateNumber, programName });

    // Crear el certificado usando SimpleCert
    const simpleCertResponse = await fetch('https://app.simplecert.net/api/v1/certificate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SIMPLECERT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: {
          name: name,
          email: email,
        },
        custom_fields: {
          certificate_number: certificateNumber,
          program_name: programName,
          program_type: programType,
          certificate_type: certificateType,
          issue_date: issueDate,
        },
        send_email: false, // Manejaremos el envío de correo nosotros para personalizar el mensaje
      }),
    });

    if (!simpleCertResponse.ok) {
      const errorText = await simpleCertResponse.text();
      console.error('SimpleCert error:', errorText);
      throw new Error(`Error al generar el certificado: ${errorText}`);
    }

    const certificateData = await simpleCertResponse.json();
    console.log('Certificate generation response:', certificateData);

    if (!certificateData.certificate_url) {
      throw new Error('No se recibió URL del certificado generado');
    }

    const resend = new Resend(RESEND_API_KEY);

    console.log('Sending email with certificate:', certificateData.certificate_url);

    // Enviar correo electrónico usando Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'CONAPCOOP <certificados@resend.dev>',
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programName}`,
      html: `
        <h1>¡Hola ${name}!</h1>
        <p>Te adjuntamos tu certificado de ${certificateType} para el ${programType}: ${programName}.</p>
        <p>Número de certificado: ${certificateNumber}</p>
        <p>Fecha de emisión: ${issueDate}</p>
        <p>Puedes acceder a tu certificado en el siguiente enlace:</p>
        <p><a href="${certificateData.certificate_url}" target="_blank">Ver certificado</a></p>
        <p>También puedes verificar la autenticidad de tu certificado en:</p>
        <p><a href="${certificateData.verification_url}" target="_blank">Verificar certificado</a></p>
        <p>Gracias por tu participación.</p>
      `,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Certificado enviado correctamente',
        data: emailData,
        certificateUrl: certificateData.certificate_url,
        verificationUrl: certificateData.verification_url
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-certificate-email:', error);
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
