
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
    console.log('Received request with payload:', payload);

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

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const DYNAPICTURES_TOKEN = Deno.env.get('DYNAPICTURES_TOKEN');

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada');
    }

    if (!DYNAPICTURES_TOKEN) {
      throw new Error('DYNAPICTURES_TOKEN no está configurado');
    }

    const resend = new Resend(RESEND_API_KEY);

    console.log('Generating certificate for:', { name, email, certificateNumber, programName });

    // Generar URL de Dynapictures con los parámetros dinámicos
    const dynapicturesUrl = new URL('https://api.dynapictures.com/generate');
    dynapicturesUrl.searchParams.append('token', DYNAPICTURES_TOKEN);
    dynapicturesUrl.searchParams.append('template', templateUrl);
    dynapicturesUrl.searchParams.append('variables', JSON.stringify({
      name: name,
      program: programName,
      certificate_number: certificateNumber,
      date: issueDate,
      institution: "CONAPCOOP"
    }));

    console.log('Requesting certificate generation from:', dynapicturesUrl.toString());

    // Generar el certificado usando Dynapictures
    const dynaResponse = await fetch(dynapicturesUrl.toString());
    if (!dynaResponse.ok) {
      const errorText = await dynaResponse.text();
      console.error('Dynapictures error:', errorText);
      throw new Error(`Error al generar el certificado: ${errorText}`);
    }

    const certificateData = await dynaResponse.json();
    console.log('Certificate generation response:', certificateData);

    if (!certificateData.url) {
      throw new Error('No se recibió URL del certificado generado');
    }

    console.log('Sending email with certificate:', certificateData.url);

    // Enviar correo electrónico usando Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Certificados <certificados@resend.dev>',
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programName}`,
      html: `
        <h1>¡Hola ${name}!</h1>
        <p>Te adjuntamos tu certificado de ${certificateType} para el ${programType}: ${programName}.</p>
        <p>Número de certificado: ${certificateNumber}</p>
        <p>Fecha de emisión: ${issueDate}</p>
        <img src="${certificateData.url}" alt="Certificado" style="max-width: 100%;"/>
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
        data: emailData
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
