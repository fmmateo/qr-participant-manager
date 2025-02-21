
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Payload recibido:', JSON.stringify(payload, null, 2));

    const {
      name,
      email,
      certificateNumber,
      certificateType,
      programName,
      issueDate,
      templateUrl
    } = payload;

    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan datos requeridos para generar el certificado');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Generamos una URL de verificación usando la URL base de la aplicación
    // Esta URL debe coincidir con la configurada en la aplicación para la verificación de certificados
    const verificationUrl = `${Deno.env.get('SITE_URL')}/certificates/verify/${certificateNumber}`;

    // Enviar email con Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY no está configurado');
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Certificados <onboarding@resend.dev>',
        to: [email],
        subject: `Tu certificado de ${certificateType} - ${programName}`,
        html: `
          <h1>¡Felicitaciones ${name}!</h1>
          <p>Has completado exitosamente el programa ${programName}.</p>
          <p>Tu código de verificación es: ${certificateNumber}</p>
          <p>Puedes verificar la autenticidad de tu certificado en el siguiente enlace:</p>
          <p><a href="${verificationUrl}" target="_blank">Verificar certificado</a></p>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Error en respuesta de Resend:', errorData);
      throw new Error(`Error al enviar email: ${errorData.message || 'Error desconocido'}`);
    }

    const emailResult = await emailResponse.json();

    // Actualizar estado del certificado
    await supabaseClient
      .from('certificates')
      .update({
        sent_email_status: 'SUCCESS',
        sent_at: new Date().toISOString(),
        verification_url: verificationUrl
      })
      .eq('certificate_number', certificateNumber);

    return new Response(
      JSON.stringify({
        success: true,
        id: emailResult.id,
        verificationUrl
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error en generate-certificate:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido al generar el certificado'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
