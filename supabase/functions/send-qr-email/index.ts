
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

    console.log('Iniciando proceso de envío de email para:', { name, email });

    // Crear contenido del QR
    const qrData = JSON.stringify({
      name,
      email,
      qrCode,
      timestamp: new Date().toISOString()
    });

    try {
      // Generar QR como string base64
      const qrDataUrl = await QRCode.toDataURL(qrData);
      console.log('QR generado exitosamente, longitud del QR:', qrDataUrl.length);

      const emailResponse = await resend.emails.send({
        from: "Asistencia <onboarding@resend.dev>",
        to: email,
        subject: "Tu Código QR para Registro de Asistencia",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">¡Bienvenido/a ${name}!</h1>
            <p style="color: #666; font-size: 16px; text-align: center;">
              Aquí está tu código QR personal para registrar tu asistencia:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <img src="${qrDataUrl}" alt="Tu código QR" style="max-width: 300px; width: 100%; height: auto;"/>
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
        `
      });

      console.log('Respuesta de Resend:', JSON.stringify(emailResponse, null, 2));

      return new Response(
        JSON.stringify({ success: true, data: emailResponse }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        },
      );

    } catch (emailError) {
      console.error('Error enviando email:', JSON.stringify(emailError, null, 2));
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
