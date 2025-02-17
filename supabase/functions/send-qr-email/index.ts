
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import QRCode from "npm:qrcode@1.5.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Received request");

  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, qrCode } = await req.json();
    console.log("Processing request for:", { name, email, qrCode });

    if (!name || !email || !qrCode) {
      throw new Error("Missing required fields");
    }

    // Generar QR code
    const qrCodeDataUrl = await QRCode.toDataURL(qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    console.log("QR code generated successfully");

    // Convertir data URL a base64
    const base64Data = qrCodeDataUrl.split(",")[1];

    // Enviar email con QR code
    const data = await resend.emails.send({
      from: "QR Codes <onboarding@resend.dev>",
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
          content: base64Data,
          base64: true,
          cid: "qr-code",
        },
      ],
    });

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
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
