
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
  try {
    const {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate,
      templateUrl,
    } = await req.json() as CertificateEmailPayload;

    if (!email || !name || !certificateNumber || !programName || !templateUrl) {
      throw new Error('Faltan campos requeridos');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada');
    }

    console.log('Generating certificate for:', { name, email, certificateNumber, programName });

    // Generar URL de Dynapictures con los parámetros dinámicos y el token de autenticación
    const dynapicturesUrl = new URL('https://api.dynapictures.com/generate');
    dynapicturesUrl.searchParams.append('token', Deno.env.get('DYNAPICTURES_TOKEN') || '');
    dynapicturesUrl.searchParams.append('template', templateUrl);
    dynapicturesUrl.searchParams.append('variables', JSON.stringify({
      name: name,
      program: programName,
      certificate_number: certificateNumber,
      date: new Date(issueDate).toLocaleDateString('es-ES'),
      institution: "Universidad XYZ"
    }));

    console.log('Dynapictures URL:', dynapicturesUrl.toString());

    // Generar el certificado usando Dynapictures
    const dynaResponse = await fetch(dynapicturesUrl.toString());
    if (!dynaResponse.ok) {
      throw new Error('Error al generar el certificado con Dynapictures');
    }

    // Obtener la URL del certificado generado
    const certificateData = await dynaResponse.json();
    const certificateImageUrl = certificateData.url;

    // Enviar correo electrónico usando Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Certificados <certificados@resend.dev>',
        to: email,
        subject: `Tu certificado de ${certificateType} - ${programName}`,
        html: `
          <h1>¡Hola ${name}!</h1>
          <p>Te adjuntamos tu certificado de ${certificateType} para el ${programType}: ${programName}.</p>
          <p>Número de certificado: ${certificateNumber}</p>
          <p>Fecha de emisión: ${issueDate}</p>
          <img src="${certificateImageUrl}" alt="Certificado" style="max-width: 100%;"/>
          <p>Gracias por tu participación.</p>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('Error sending email:', errorData);
      throw new Error('Error al enviar el correo electrónico');
    }

    const data = await resendResponse.json();
    console.log('Email sent successfully:', data);

    return new Response(JSON.stringify({ message: 'Certificado enviado correctamente' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})
