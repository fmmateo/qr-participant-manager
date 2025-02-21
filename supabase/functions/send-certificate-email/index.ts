
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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
      programName,
      issueDate,
      htmlContent
    } = await req.json()

    const emailResponse = await resend.emails.send({
      from: "Certificados <certificados@tu-dominio-verificado.com>",
      to: email,
      subject: `Tu Certificado de ${certificateType} - ${programName}`,
      html: `
        <div>
          <p>Hola ${name},</p>
          <p>¡Felicitaciones! Adjunto encontrarás tu certificado de ${certificateType} para el programa ${programName}.</p>
          ${htmlContent}
          <p>Fecha de emisión: ${issueDate}</p>
          <p>Número de certificado: ${certificateNumber}</p>
          <p>Puedes verificar la autenticidad de este certificado visitando:</p>
          <p><a href="${Deno.env.get('SUPABASE_URL')}/certificates/verify/${certificateNumber}">Verificar Certificado</a></p>
        </div>
      `,
    });

    console.log('Email enviado exitosamente:', emailResponse);

    return new Response(
      JSON.stringify(emailResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )

  } catch (error) {
    console.error('Error en send-certificate-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      },
    )
  }
})
