
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
    
    // Verificar que tenemos la API key
    const apiKey = Deno.env.get('APIFLASH_ACCESS_KEY')
    if (!apiKey) {
      console.error('APIFLASH_ACCESS_KEY no está configurada');
      throw new Error('APIFlash access key not configured')
    }

    console.log('Generando certificado para:', participantName);
    console.log('Template URL:', templateUrl);

    // Usar APIFlash para generar el certificado
    const apiflashUrl = new URL('https://api.apiflash.com/v1/urltoimage')
    apiflashUrl.searchParams.append('access_key', apiKey)
    apiflashUrl.searchParams.append('url', templateUrl)
    apiflashUrl.searchParams.append('quality', '100')
    apiflashUrl.searchParams.append('width', '1600')
    apiflashUrl.searchParams.append('height', '1200')
    apiflashUrl.searchParams.append('response_type', 'json')
    
    // Agregar texto al certificado
    apiflashUrl.searchParams.append('text', participantName)
    apiflashUrl.searchParams.append('text_color', '#000000')
    apiflashUrl.searchParams.append('text_size', '48')
    apiflashUrl.searchParams.append('text_font', 'Arial')
    apiflashUrl.searchParams.append('text_position', 'center')

    console.log('Calling APIFlash with URL:', apiflashUrl.toString());

    const response = await fetch(apiflashUrl.toString())
    
    // Log de la respuesta para debug
    console.log('APIFlash response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('APIFlash error response:', errorText);
      throw new Error(`APIFlash error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('APIFlash response:', data);

    // APIFlash devuelve directamente una URL en su respuesta JSON
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
    console.error('Error detallado:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
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
