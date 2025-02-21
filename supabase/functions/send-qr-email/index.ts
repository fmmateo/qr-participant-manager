
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

    // Generar QR como URL de datos
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
      name,
      email,
      qrCode,
      timestamp: new Date().toISOString()
    }));

    const emailResponse = await resend.emails.send({
      from: "Registro <registro@tu-dominio-verificado.com>",
      to: email,
      subject: "Tu Código QR para Registro de Asistencia",
      html: `
        <div>
          <h1>¡Bienvenido/a ${name}!</h1>
          <p>Gracias por registrarte. Aquí está tu código QR personal para registrar tu asistencia:</p>
          <img src="${qrDataUrl}" alt="Tu código QR" style="width: 200px; height: 200px;"/>
          <p>Por favor, guarda este código QR. Lo necesitarás para registrar tu asistencia en las sesiones.</p>
          <p>Instrucciones:</p>
          <ol>
            <li>Guarda este código QR en tu teléfono o imprímelo</li>
            <li>Muestra el código al llegar a cada sesión</li>
            <li>El personal escaneará tu código para registrar tu asistencia</li>
          </ol>
          <p>¡Te esperamos!</p>
        </div>
      `,
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
