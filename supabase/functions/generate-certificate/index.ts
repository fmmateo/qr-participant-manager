
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando generación de certificado...');
    
    const payload = await req.json();
    console.log('Payload completo recibido:', payload);

    // Extraer datos del payload
    const {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate,
      templateId,
      design
    } = payload;

    // Validar datos requeridos
    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan datos requeridos para generar el certificado');
    }

    // Crear cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Generar HTML del certificado
    const templateHtml = design?.design_params?.template_html?.text;
    if (!templateHtml) {
      throw new Error('El diseño no contiene una plantilla HTML válida');
    }

    // Validar recursos del diseño
    const logoUrl = design?.design_params?.logo_url?.url;
    const signatureUrl = design?.design_params?.signature_url?.url;

    if (!logoUrl) {
      throw new Error('El diseño debe incluir un logo');
    }

    if (!signatureUrl) {
      throw new Error('El diseño debe incluir una firma');
    }

    // Reemplazar variables en el HTML
    let certificateHtml = templateHtml
      .replace(/\[Nombre\]/g, name)
      .replace(/\[Curso\]/g, programName)
      .replace(/\[Fecha\]/g, issueDate)
      .replace(/\[Código\]/g, certificateNumber)
      .replace('src="" id="logoEmpresa"', `src="${logoUrl}" id="logoEmpresa"`)
      .replace('src="" id="firmaDigital"', `src="${signatureUrl}" id="firmaDigital"`);

    console.log('HTML generado correctamente');

    try {
      console.log('Iniciando conversión a PDF con Browserless...');
      
      // Convertir HTML a PDF usando Browserless
      const browserlessToken = Deno.env.get('BROWSERLESS_API_KEY');
      if (!browserlessToken) {
        throw new Error('BROWSERLESS_API_KEY no está configurado');
      }

      const pdfResponse = await fetch('https://chrome.browserless.io/pdf', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${browserlessToken}`
        },
        body: JSON.stringify({
          html: certificateHtml,
          options: {
            displayHeaderFooter: false,
            printBackground: true,
            format: 'Letter',
            landscape: true,
            margin: {
              top: '0.4in',
              right: '0.4in',
              bottom: '0.4in',
              left: '0.4in'
            },
            scale: 1
          },
          gotoOptions: {
            waitUntil: 'networkidle0',
            timeout: 30000
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
      console.log('PDF generado exitosamente, tamaño:', pdfBuffer.byteLength);

      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
      console.log('PDF convertido a base64');

      // Enviar correo usando Resend
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        throw new Error('RESEND_API_KEY no está configurado');
      }

      console.log('Enviando email con Resend...');
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
      console.log('Email enviado exitosamente:', emailResult);

      // Actualizar estado del certificado
      const { error: updateError } = await supabaseClient
        .from('certificates')
        .update({
          sent_email_status: 'SUCCESS',
          sent_at: new Date().toISOString(),
          verification_url: `https://certificados.example.com/verify/${certificateNumber}`
        })
        .eq('certificate_number', certificateNumber);

      if (updateError) {
        console.error('Error al actualizar certificado:', updateError);
        throw new Error('Error al actualizar el estado del certificado');
      }

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

    } catch (innerError) {
      console.error('Error interno:', innerError);

      // Actualizar estado de error
      await supabaseClient
        .from('certificates')
        .update({
          sent_email_status: 'ERROR',
          last_error: innerError.message,
          retry_count: 1
        })
        .eq('certificate_number', certificateNumber);

      throw innerError;
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
