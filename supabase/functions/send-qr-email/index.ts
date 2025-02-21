
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
    console.log('Recibidos datos:', { name, email, qrCode });

    if (!name || !email || !qrCode) {
      console.error('Datos faltantes:', { name, email, qrCode });
      throw new Error('Faltan datos requeridos');
    }

    // Crear una URL SVG del código QR
    const svg = await new Promise((resolve, reject) => {
      QRCode.toString(qrCode, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        width: 400,
        margin: 1,
      }, (err, string) => {
        if (err) reject(err);
        else resolve(string);
      });
    });

    console.log('QR SVG generado correctamente');

    // Convertir el SVG a una URL de datos
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg as string)}`;
    console.log('URL de datos SVG generada');

    const emailResponse = await resend.emails.send({
      from: "Asistencia <onboarding@resend.dev>",
      to: [email],
      subject: "Tu Código QR para Registro de Asistencia",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Tu Código QR para Asistencia</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center; margin-bottom: 20px;">
                ¡Bienvenido/a ${name}!
              </h1>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="text-align: center; color: #666; margin-bottom: 20px;">
                  Este es tu código QR personal para registrar tu asistencia:
                </p>
                
                <div style="text-align: center; margin: 20px 0;">
                  ${svg}
                </div>
                
                <p style="text-align: center; color: #666; margin-top: 20px;">
                  Tu código de registro es: <strong>${qrCode}</strong>
                </p>
              </div>
              
              <div style="margin-top: 20px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
                <h2 style="color: #333; margin-bottom: 10px; font-size: 18px;">
                  Instrucciones:
                </h2>
                <ol style="color: #666; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Guarda este código QR en tu teléfono o imprímelo</li>
                  <li style="margin-bottom: 8px;">Muestra el código QR al llegar a cada sesión</li>
                  <li style="margin-bottom: 8px;">El personal escaneará tu código para registrar tu asistencia</li>
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

  } catch (error) {
    console.error('Error en el proceso:', error);
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
});
