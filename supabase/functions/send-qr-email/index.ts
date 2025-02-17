
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Received request to send-qr-email");

  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, qrCode } = await req.json();
    console.log("Processing request for:", { name, email, qrCode });

    if (!name || !email || !qrCode) {
      console.error("Missing required fields:", { name, email, qrCode });
      throw new Error("Missing required fields");
    }

    // Validar el API key de Resend
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }
    console.log("RESEND_API_KEY is configured");

    // Generar QR code usando la API externa
    console.log("Generating QR code...");
    const qrToken = Deno.env.get("QR_CODE_GENERATOR_TOKEN");
    if (!qrToken) {
      throw new Error("QR_CODE_GENERATOR_TOKEN not configured");
    }

    const participantData = {
      name,
      email,
      qrCode,
      timestamp: new Date().toISOString()
    };

    const qrResponse = await fetch(
      `https://api.qr-code-generator.com/v1/create?access-token=${qrToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frame_name: "no-frame",
        qr_code_text: JSON.stringify(participantData),
        image_format: "PNG",
        qr_code_logo: "scan-me-square",
        foreground_color: "#000000",
        background_color: "#ffffff",
      })
    });

    if (!qrResponse.ok) {
      throw new Error(`Error generating QR code: ${qrResponse.statusText}`);
    }

    const qrImageBuffer = await qrResponse.arrayBuffer();
    const qrBase64 = btoa(String.fromCharCode(...new Uint8Array(qrImageBuffer)));
    console.log("QR code generated successfully");

    console.log("Attempting to send email...");
    // Enviar email con QR code
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });
  } catch (error) {
    console.error("Error in send-qr-email function:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
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
