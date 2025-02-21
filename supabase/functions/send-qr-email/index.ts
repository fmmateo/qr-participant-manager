
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0";
import QRCode from 'npm:qrcode@1.5.3'

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
    const { name, email, qrCode } = await req.json()

    console.log('Generando QR para:', { name, email, qrCode });

    // Generar QR como URL de datos Base64
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
      name,
      email,
      qrCode,
      timestamp: new Date().toISOString()
    }), {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    // Extraer la parte Base64 de la URL de datos
    const base64Data = qrDataUrl.split(',')[1];

    console.log('QR generado exitosamente');

    const emailResponse = await resend.emails.send({
      from: "Registro <registro@twinsrd.com>",
      to: email,
      subject: "Tu Código QR para Registro de Asistencia",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">¡Bienvenido/a ${name}!</h1>
          <p style="color: #666; font-size: 16px;">Gracias por registrarte. Aquí está tu código QR personal para registrar tu asistencia:</p>
          <div style="text-align: center; margin: 30px 0;">
            <img src="cid:qr-code" alt="Tu código QR" style="max-width: 300px; width: 100%; height: auto;"/>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; font-weight: bold;">Instrucciones:</p>
            <ol style="color: #666;">
              <li>Guarda este código QR en tu teléfono o imprímelo</li>
              <li>Muestra el código al llegar a cada sesión</li>
              <li>El personal escaneará tu código para registrar tu asistencia</li>
            </ol>
          </div>
          <p style="color: #666; text-align: center; margin-top: 30px;">¡Te esperamos!</p>
        </div>
      `,
      attachments: [
        {
          filename: 'qr-code.png',
          content: base64Data,
          content_id: 'qr-code',
          disposition: 'inline'
        }
      ],
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
    console.error('Error en send-qr-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      },
    )
  }
})
