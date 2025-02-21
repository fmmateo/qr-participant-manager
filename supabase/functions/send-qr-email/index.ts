
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0";
import * as base64 from "https://deno.land/std@0.190.0/encoding/base64.ts";

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

    if (!name || !email || !qrCode) {
      console.error('Datos faltantes:', { name, email, qrCode });
      throw new Error('Faltan datos requeridos');
    }

    console.log('Iniciando proceso de envío de email para:', { name, email });

    // Crear contenido del QR como objeto
    const qrContent = {
      name,
      email,
      qrCode,
      timestamp: new Date().toISOString()
    };

    console.log('Contenido del QR:', qrContent);

    try {
      const emailResponse = await resend.emails.send({
        from: "Registro <registro@twinsrd.com>",
        to: email,
        subject: "Tu Código QR para Registro de Asistencia",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">¡Bienvenido/a ${name}!</h1>
            <p style="color: #666; font-size: 16px;">Gracias por registrarte. Para registrar tu asistencia, usa este código: ${qrCode}</p>
            <div style="text-align: center; margin: 30px 0; background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p style="font-size: 24px; font-weight: bold; color: #333;">${qrCode}</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #333; font-weight: bold;">Instrucciones:</p>
              <ol style="color: #666;">
                <li>Guarda este código</li>
                <li>Muestra el código al llegar a cada sesión</li>
                <li>El personal registrará tu asistencia con este código</li>
              </ol>
            </div>
            <p style="color: #666; text-align: center; margin-top: 30px;">¡Te esperamos!</p>
          </div>
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
      console.error('Error enviando email:', emailError);
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
