
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    if (req.method !== "POST") {
      throw new Error(`HTTP method ${req.method} not allowed`);
    }

    const { name, email, qrCode } = await req.json();
    console.log("Processing request for:", { name, email, qrCode });

    if (!name || !email || !qrCode) {
      throw new Error("Missing required fields: name, email, or qrCode");
    }

    // Datos para el QR
    const participantData = {
      name,
      email,
      qrCode,
      timestamp: new Date().toISOString()
    };

    // Construir el contenido del QR
    const qrContent = JSON.stringify(participantData);

    // Generar URL del QR usando un servicio gratuito
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;

    // Enviar email
    console.log("Sending email...");
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: "Asistencias <noreply@resend.dev>",
      to: [email],
      subject: "Tu código QR de asistencia",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">¡Hola ${name}!</h1>
          <p style="color: #666;">Aquí está tu código QR personal para registrar tu asistencia:</p>
          <div style="text-align: center;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 300px; height: 300px; margin: 20px 0;">
          </div>
          <p style="color: #666;">Guarda este código y muéstralo al momento de registrar tu asistencia.</p>
          <p style="color: #666; margin-top: 20px;">¡Gracias!</p>
        </div>
      `,
    });

    if (emailError) {
      throw emailError;
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
      }
    );
  } catch (error) {
    console.error("Error in send-qr-email function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
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
