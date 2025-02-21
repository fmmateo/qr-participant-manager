
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0";
import QRCode from "npm:qrcode";

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
    const { name, email, qrCode } = await req.json();

    if (!name || !email || !qrCode) {
      console.error('Datos faltantes:', { name, email, qrCode });
      throw new Error('Faltan datos requeridos');
    }

    console.log('Procesando solicitud para:', { name, email, qrCode });

    try {
      // Generar QR en formato PNG usando toBuffer
      const qrBuffer = await QRCode.toBuffer(qrCode, {
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 1,
        type: 'png'
      });

      // Convertir el buffer a base64
      const qrBase64 = `data:image/png;base64,${qrBuffer.toString('base64')}`;
      console.log('QR generado exitosamente');

      const emailResponse = await resend.emails.send({
        from: "Asistencia <onboarding@resend.dev>",
        to: [email],
        subject: "Tu Código QR para Registro de Asistencia",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Tu Código QR</title>
            </head>
            <body>
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333; text-align: center;">¡Bienvenido/a ${name}!</h1>
                <p style="color: #666; font-size: 16px; text-align: center;">
                  Aquí está tu código QR personal para registrar tu asistencia:
                </p>
                <div style="text-align: center; margin: 30px 0; background-color: white; padding: 20px;">
                  <img src="${qrBase64}" 
                       alt="Tu código QR" 
                       style="width: 400px; height: 400px;"
                  />
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">
                  Tu código de registro es: <strong>${qrCode}</strong>
                </p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #333; font-weight: bold;">Instrucciones:</p>
                  <ol style="color: #666;">
                    <li>Guarda este código QR en tu teléfono o imprímelo</li>
                    <li>Muestra el código QR al llegar a cada sesión</li>
                    <li>El personal escaneará tu código para registrar tu asistencia</li>
                  </ol>
                </div>
              </div>
            </body>
          </html>
        `
      });

      console.log('Email enviado exitosamente:', emailResponse);

      return new Response(
        JSON.stringify({ success: true, data: emailResponse }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        },
      );

    } catch (emailError) {
      console.error('Error en el proceso:', emailError);
      throw emailError;
    }

  } catch (error) {
    console.error('Error en send-qr-email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      },
    );
  }
})
