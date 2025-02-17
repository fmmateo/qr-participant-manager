
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, qrCode } = await req.json();

    console.log("Received request to send QR code:", { name, email, qrCode });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    console.log("QR code generated successfully");

    // Convert data URL to base64
    const base64Data = qrCodeDataUrl.split(",")[1];

    // Send email with QR code
    const data = await resend.emails.send({
      from: "QR Codes <onboarding@resend.dev>",
      to: [email],
      subject: "Tu código QR de asistencia",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>¡Hola ${name}!</h1>
          <p>Aquí está tu código QR personal para registrar tu asistencia:</p>
          <img src="cid:qr-code" alt="QR Code" style="width: 300px; height: 300px;">
          <p>Guarda este código y muéstralo al momento de registrar tu asistencia.</p>
          <p>¡Gracias!</p>
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
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
