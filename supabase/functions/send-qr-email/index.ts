
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface EmailRequest {
  name: string;
  email: string;
  qrCode: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("Checking Resend API key:", resendApiKey ? "Present" : "Missing");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no está configurada");
    }

    if (req.method !== "POST") {
      throw new Error(`Método HTTP ${req.method} no permitido`);
    }

    let requestData: EmailRequest;
    try {
      requestData = await req.json();
      console.log("Datos recibidos:", JSON.stringify(requestData, null, 2));
    } catch (e) {
      throw new Error(`Error al parsear JSON: ${e.message}`);
    }

    const { name, email, qrCode } = requestData;
    if (!name || !email || !qrCode) {
      throw new Error(`Campos requeridos faltantes. Recibido: ${JSON.stringify({ name, email, qrCode })}`);
    }

    console.log("Inicializando cliente Resend");
    const resend = new Resend(resendApiKey);

    const participantData = {
      name,
      email,
      qrCode,
      timestamp: new Date().toISOString()
    };

    const qrContent = JSON.stringify(participantData);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;
    console.log("URL del QR generada:", qrCodeUrl);

    // En modo desarrollo/pruebas, enviamos solo a la dirección verificada
    const isDevelopment = !Deno.env.get("PRODUCTION");
    const toEmail = isDevelopment ? "fmmateo98@gmail.com" : email;
    
    console.log("Intentando enviar email a:", toEmail);
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: "Asistencias <onboarding@resend.dev>", // Cambiar esto por tu dominio verificado
      to: [toEmail],
      subject: "Tu código QR de asistencia",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">¡Hola ${name}!</h1>
          <p style="color: #666;">Aquí está tu código QR personal para registrar tu asistencia:</p>
          <div style="text-align: center;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 300px; height: 300px; margin: 20px 0;">
          </div>
          <p style="color: #666;">Guarda este código y muéstralo al momento de registrar tu asistencia.</p>
          ${isDevelopment ? `<p style="color: red;">MODO DESARROLLO: Email original destinado a: ${email}</p>` : ''}
          <p style="color: #666; margin-top: 20px;">¡Gracias!</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Error de Resend:", emailError);
      throw new Error(`Error al enviar email: ${emailError.message}`);
    }

    console.log("Email enviado exitosamente:", emailResponse);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isDevelopment ? 
          "Email enviado exitosamente (modo desarrollo - enviado a email verificado)" : 
          "Email enviado exitosamente",
        data: emailResponse 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    );
  } catch (error) {
    console.error("Error detallado en send-qr-email:");
    console.error("Tipo de error:", error.constructor.name);
    console.error("Mensaje:", error.message);
    console.error("Stack:", error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error desconocido",
        details: {
          type: error.constructor.name,
          stack: error.stack
        }
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    );
  }
});
