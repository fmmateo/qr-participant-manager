
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateCertificateRequest {
  templateUrl: string
  participantName: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { templateUrl, participantName }: GenerateCertificateRequest = await req.json()

    // Usar APIFlash para generar el certificado
    const apiflashUrl = new URL('https://api.apiflash.com/v1/urltoimage')
    apiflashUrl.searchParams.append('access_key', Deno.env.get('APIFLASH_ACCESS_KEY') || '')
    apiflashUrl.searchParams.append('url', templateUrl)
    apiflashUrl.searchParams.append('format', 'jpeg')
    apiflashUrl.searchParams.append('quality', '100')
    apiflashUrl.searchParams.append('width', '1600')
    apiflashUrl.searchParams.append('height', '1200')
    
    // Agregar texto al certificado
    apiflashUrl.searchParams.append('text', participantName)
    apiflashUrl.searchParams.append('text_color', '#000000')
    apiflashUrl.searchParams.append('text_size', '48')
    apiflashUrl.searchParams.append('text_font', 'Arial')
    apiflashUrl.searchParams.append('text_position', 'center')

    const response = await fetch(apiflashUrl.toString())
    if (!response.ok) {
      throw new Error('Error al generar el certificado')
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ url: data.url }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  }
})
