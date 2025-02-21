
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

    // Construir el HTML directamente aquí para mejor control
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
          }
          .certificate {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px;
            border: 2px solid #000;
            text-align: center;
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
      const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
      if (!browserlessApiKey) {
        throw new Error('BROWSERLESS_API_KEY no está configurado');
      }

      console.log('Generando PDF...');

      const pdfResponse = await fetch('https://chrome.browserless.io/pdf', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${browserlessApiKey}`
        },
        body: JSON.stringify({
          html: certificateHtml,
          options: {
            printBackground: true,
            format: 'Letter',
            landscape: true,
            margin: {
              top: '0.5in',
              right: '0.5in',
              bottom: '0.5in',
              left: '0.5in'
            },
            preferCSSPageSize: false,
            scale: 0.8
          }
        })
      });

      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        console.error('Error en respuesta de Browserless:', {
          status: pdfResponse.status,
          statusText: pdfResponse.statusText,
          error: errorText
        });
        throw new Error(`Error al generar PDF: ${pdfResponse.status} - ${errorText}`);
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

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
            <p>Adjunto encontrarás tu certificado en formato PDF.</p>
          `,
          attachments: [{
            filename: `certificado-${certificateNumber}.pdf`,
            content: pdfBase64
          }]
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
          verification_url: `https://certificados.example.com/verify/${certificateNumber}`
        })
        .eq('certificate_number', certificateNumber);

      return new Response(
        JSON.stringify({
          success: true,
          id: emailResult.id,
          verificationUrl: `https://certificados.example.com/verify/${certificateNumber}`
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
