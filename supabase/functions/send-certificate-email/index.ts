
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
    const body = await req.json()
    const { name, email, certificateNumber, certificateType, programType, programName, issueDate, templateUrl } = body

    // Validar campos requeridos
    if (!email) {
      throw new Error('El campo "email" es requerido')
    }

    console.log('Received request with body:', body);

    // Enviar correo electrónico usando fetch directamente a la API de Resend
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
          ${templateUrl ? `<img src="${templateUrl}" alt="Certificado" style="max-width: 100%;"/>` : ''}
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
