
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { certificateNumber } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener datos del certificado
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select(`
        *,
        participants (
          name,
          email
        )
      `)
      .eq('certificate_number', certificateNumber)
      .single();

    if (certError || !certificate) {
      throw new Error('Error al obtener el certificado');
    }

    const verificationUrl = `${req.headers.get('origin')}/certificates/verify/${certificateNumber}`;

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: "Certificados <onboarding@resend.dev>",
      to: [certificate.participants.email],
      subject: `Tu certificado de ${certificate.program_name} está listo`,
      html: `
        <h1>¡Hola ${certificate.participants.name}!</h1>
        <p>Tu certificado de ${certificate.program_name} está listo.</p>
        <p>Puedes acceder a tu certificado a través del siguiente enlace:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Número de certificado: ${certificateNumber}</p>
        <br>
        <p>¡Felicitaciones!</p>
      `
    });

    console.log('Email enviado:', emailResponse);

    // Actualizar estado de envío
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        sent_email_status: 'SUCCESS',
        sent_at: new Date().toISOString()
      })
      .eq('certificate_number', certificateNumber);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado correctamente" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
