
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log("Initializing Resend with API key");
    const resend = new Resend(resendApiKey);

    if (req.method !== "POST") {
      throw new Error(`HTTP method ${req.method} not allowed`);
    }

    const requestData = await req.json();
    console.log("Received request data:", requestData);

    const { name, email, qrCode } = requestData as EmailRequest;

    if (!name || !email || !qrCode) {
      throw new Error(`Missing required fields. Received: ${JSON.stringify({ name, email, qrCode })}`);
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
    console.log("QR content:", qrContent);

    // Generar URL del QR usando un servicio gratuito
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;
    console.log("Generated QR URL:", qrCodeUrl);

    // Enviar email
    console.log("Attempting to send email to:", email);
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: "Asistencias <onboarding@resend.dev>",
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
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
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
    console.error("Error in send-qr-email function:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Detailed error:", errorMessage);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
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
