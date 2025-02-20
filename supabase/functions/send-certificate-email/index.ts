
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
      templateUrl
    } = await req.json()

    // Validar campos requeridos
    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan campos requeridos')
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

    const certificateImage = await dynaResponse.blob();
    const certificateUrl = URL.createObjectURL(certificateImage);

    // Enviar correo electrónico usando Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Certificados <certificados@resend.dev>',
        to: [email],
        subject: `Tu certificado de ${programType}: ${programName}`,
        html: `
          <h1>¡Felicitaciones ${name}!</h1>
          <p>Te adjuntamos tu certificado de ${certificateType} para el ${programType}: ${programName}.</p>
          <p>Número de certificado: ${certificateNumber}</p>
          <p>Fecha de emisión: ${issueDate}</p>
          <img src="${certificateUrl}" alt="Certificado" style="max-width: 100%;"/>
          <p>Gracias por tu participación.</p>
        `,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error('Resend API error:', errorData);
      throw new Error(errorData.message || 'Error al enviar el correo')
    }

    return new Response(
      JSON.stringify({ message: 'Correo enviado exitosamente' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in send-certificate-email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
