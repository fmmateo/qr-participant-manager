
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    const {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate,
      templateUrl,
      design
    } = await req.json();

    console.log('Datos recibidos:', {
      name,
      email,
      certificateNumber,
      programType,
      programName,
      templateUrl,
      designParams: design?.design_params
    });

    // Validar datos requeridos
    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan datos requeridos para generar el certificado');
    }

    // Generar HTML del certificado usando el diseño proporcionado
    const certificateHtml = design?.design_params?.template_html?.text || '';
    
    // Convertir HTML a PDF usando html-pdf-chrome
    const pdfResponse = await fetch('https://api.pdfendpoint.com/v1/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('PDF_API_KEY')}`
      },
      body: JSON.stringify({
        html: certificateHtml,
        options: {
          format: 'A4',
          landscape: true,
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm'
          }
        }
      })
    });

    if (!pdfResponse.ok) {
      throw new Error('Error al generar el PDF del certificado');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    
    // Enviar correo usando Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'fmmateo98@gmail.com', // Email verificado para pruebas
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
          content: Buffer.from(pdfBuffer).toString('base64')
        }]
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Error al enviar email:', errorData);
      throw new Error(`Error al enviar email: ${errorData.message || 'Error desconocido'}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email enviado exitosamente:', emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        id: emailResult.id,
        verificationUrl: `https://certificados.example.com/verify/${certificateNumber}`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error en generate-certificate:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido al generar el certificado'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
