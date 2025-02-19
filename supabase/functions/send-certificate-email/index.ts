
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
    const { name, email, certificateNumber, certificateType, programType, programName, issueDate, templateUrl } = await req.json()

    // Si hay una plantilla, procesarla con APIFlash
    let certificateImageUrl = null
    if (templateUrl) {
      const apiflashUrl = new URL('https://api.apiflash.com/v1/urltoimage')
      apiflashUrl.searchParams.append('access_key', Deno.env.get('APIFLASH_ACCESS_KEY') || '')
      apiflashUrl.searchParams.append('url', templateUrl)
      apiflashUrl.searchParams.append('format', 'jpeg')
      apiflashUrl.searchParams.append('quality', '100')
      apiflashUrl.searchParams.append('response_type', 'json')
      
      // Solo agregar nombre del participante y nombre del programa
      apiflashUrl.searchParams.append('text', `${name}\n${programName}`)
      apiflashUrl.searchParams.append('text_color', '#000000')
      apiflashUrl.searchParams.append('text_size', '24')
      apiflashUrl.searchParams.append('text_font', 'Arial')
      apiflashUrl.searchParams.append('text_position', 'center')

      const response = await fetch(apiflashUrl.toString())
      const data = await response.json()
      certificateImageUrl = data.url
    }

    // Enviar correo electrónico usando fetch directamente a la API de Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Certificados <certificados@resend.dev>',
        to: email,
        subject: `Tu certificado de ${programType}: ${programName}`,
        html: `
          <h1>¡Felicitaciones ${name}!</h1>
          <p>Te adjuntamos tu certificado de ${certificateType} para el ${programType}: ${programName}.</p>
          <p>Número de certificado: ${certificateNumber}</p>
          <p>Fecha de emisión: ${issueDate}</p>
          ${certificateImageUrl ? `<img src="${certificateImageUrl}" alt="Certificado" style="max-width: 100%;"/>` : ''}
          <p>Gracias por tu participación.</p>
        `,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
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
