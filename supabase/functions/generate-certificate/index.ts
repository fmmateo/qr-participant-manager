
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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
            width: 1000px;
            margin: 0 auto;
            padding: 40px;
            border: 2px solid #000;
            text-align: center;
            background: white;
          }
          .logo {
            width: 200px;
            height: auto;
            margin-bottom: 20px;
          }
          .signature {
            width: 150px;
            height: auto;
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
      console.log('Iniciando generación de imagen...');

      // Iniciar Puppeteer
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Configurar viewport para el certificado
      await page.setViewport({
        width: 1100,
        height: 800,
        deviceScaleFactor: 2
      });

      // Cargar el HTML
      await page.setContent(certificateHtml, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Generar la imagen
      const screenshotBuffer = await page.screenshot({
        type: 'png',
        fullPage: true,
        encoding: 'binary'
      });

      await browser.close();

      // Convertir el buffer a base64
      const imageBase64 = btoa(
        new Uint8Array(screenshotBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Subir la imagen a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from('certificates')
        .upload(
          `${certificateNumber}.png`, 
          decode(imageBase64),
          {
            contentType: 'image/png',
            cacheControl: '3600'
          }
        );

      if (uploadError) {
        throw new Error(`Error al subir imagen: ${uploadError.message}`);
      }

      // Obtener URL pública de la imagen
      const { data: { publicUrl } } = supabaseClient
        .storage
        .from('certificates')
        .getPublicUrl(`${certificateNumber}.png`);

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
            <p><a href="${publicUrl}" target="_blank">Ver certificado</a></p>
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
          verification_url: publicUrl,
          image_url: publicUrl
        })
        .eq('certificate_number', certificateNumber);

      return new Response(
        JSON.stringify({
          success: true,
          id: emailResult.id,
          verificationUrl: publicUrl,
          imageUrl: publicUrl
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
