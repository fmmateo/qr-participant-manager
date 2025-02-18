
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

    // Validación de campos requeridos
    if (!name || !email || !qrCode) {
      throw new Error("Missing required fields: name, email, or qrCode");
    }

    // Validación de API keys
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const qrToken = Deno.env.get("QR_CODE_GENERATOR_TOKEN");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!qrToken) {
      throw new Error("QR_CODE_GENERATOR_TOKEN not configured");
    }

    // Datos para el QR
    const participantData = {
      name,
      email,
      qrCode,
      timestamp: new Date().toISOString()
    };

    // Generar QR code
    console.log("Generating QR code...");
    const qrResponse = await fetch(
      `https://api.qr-code-generator.com/v1/create?access-token=${qrToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frame_name: "no-frame",
          qr_code_text: JSON.stringify(participantData),
          image_format: "PNG",
          qr_code_logo: "scan-me-square",
          foreground_color: "#000000",
          background_color: "#ffffff",
        }),
      }
    );

    if (!qrResponse.ok) {
      throw new Error(`Error generating QR code: ${qrResponse.statusText}`);
    }

    const qrImageBuffer = await qrResponse.arrayBuffer();
    const qrBase64 = btoa(String.fromCharCode(...new Uint8Array(qrImageBuffer)));
    console.log("QR code generated successfully");

    // Enviar email
    console.log("Sending email...");
    const emailResponse = await resend.emails.send({
      from: "noreply@resend.dev",
      to: [email],
      subject: "Tu código QR de asistencia",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">¡Hola ${name}!</h1>
          <p style="color: #666;">Aquí está tu código QR personal para registrar tu asistencia:</p>
          <div style="text-align: center;">
            <img src="cid:qr-code" alt="QR Code" style="width: 300px; height: 300px; margin: 20px 0;">
          </div>
          <p style="color: #666;">Guarda este código y muéstralo al momento de registrar tu asistencia.</p>
          <p style="color: #666; margin-top: 20px;">¡Gracias!</p>
        </div>
      `,
      attachments: [
        {
          filename: "qr-code.png",
          content: qrBase64,
          base64: true,
          cid: "qr-code",
        },
      ],
    });

    console.log("Email sent successfully");

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
        error: error instanceof Error ? error.message : "Unknown error occurred",
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
