
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
      design
    } = payload;

    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan datos requeridos para generar el certificado');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verificar que las URLs de los recursos son accesibles
    const logoUrl = design?.design_params?.logo_url?.url;
    const signatureUrl = design?.design_params?.signature_url?.url;

    if (!logoUrl || !signatureUrl) {
      throw new Error('Faltan recursos necesarios (logo o firma)');
    }

    // Construir el HTML
    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 40px;
            font-family: Arial, sans-serif;
            background: white;
          }
          .certificate {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px;
            border: 2px solid #000;
            text-align: center;
            background: white;
          }
          .logo {
            max-width: 200px;
            margin-bottom: 20px;
          }
          .signature {
            max-width: 150px;
            margin-top: 40px;
          }
          h1 {
            color: #333;
            font-size: 36px;
            margin-bottom: 20px;
          }
          .recipient {
            font-size: 28px;
            margin: 20px 0;
          }
          .program {
            font-size: 24px;
            margin: 20px 0;
          }
          .date {
            margin-top: 30px;
            font-style: italic;
          }
          .certificate-number {
            margin-top: 20px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <img src="${logoUrl}" alt="Logo" class="logo" />
          <h1>Certificado de ${certificateType}</h1>
          <p class="recipient">Se certifica que:</p>
          <h2>${name}</h2>
          <p class="program">Ha completado satisfactoriamente el programa:</p>
          <h3>${programName}</h3>
          <p class="date">Fecha de emisión: ${issueDate}</p>
          <img src="${signatureUrl}" alt="Firma" class="signature" />
          <p class="certificate-number">Número de certificado: ${certificateNumber}</p>
        </div>
      </body>
      </html>
    `;

    try {
      const apiFlashKey = Deno.env.get('APIFLASH_ACCESS_KEY');
      if (!apiFlashKey) {
        throw new Error('APIFLASH_ACCESS_KEY no está configurado');
      }

      console.log('Generando imagen del certificado...');

      // Codificar el HTML para la URL
      const encodedHtml = encodeURIComponent(certificateHtml);
      
      // Construir la URL de APIFlash
      const apiFlashUrl = `https://api.apiflash.com/v1/urltoimage?access_key=${apiFlashKey}&format=png&width=1200&height=800&response_type=json&url=data:text/html,${encodedHtml}&fresh=true&quality=100&wait_until=networkidle0`;

      const imageResponse = await fetch(apiFlashUrl);

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('Error en respuesta de APIFlash:', {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          error: errorText
        });
        throw new Error(`Error al generar imagen: ${imageResponse.status} - ${errorText}`);
      }

      const imageResult = await imageResponse.json();
      const certificateUrl = imageResult.url;

      console.log('Imagen del certificado generada:', certificateUrl);

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
            <p>Puedes ver tu certificado en el siguiente enlace:</p>
            <p><a href="${certificateUrl}" target="_blank">Ver certificado</a></p>
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
          verification_url: certificateUrl, // Guardamos la URL de la imagen como URL de verificación
          image_url: certificateUrl // Guardamos la URL de la imagen
        })
        .eq('certificate_number', certificateNumber);

      return new Response(
        JSON.stringify({
          success: true,
          id: emailResult.id,
          verificationUrl: certificateUrl,
          imageUrl: certificateUrl
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
      console.error('Error en proceso de generación:', error);
      
      await supabaseClient
        .from('certificates')
        .update({
          sent_email_status: 'ERROR',
          last_error: error.message,
          retry_count: 1
        })
        .eq('certificate_number', certificateNumber);

      throw error;
    }

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
