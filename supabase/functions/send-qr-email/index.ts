
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import QRCode from "npm:qrcode@1.5.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  name: string;
  email: string;
  qrCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, qrCode }: EmailRequest = await req.json();

    // Generar QR como imagen base64
    const qrDataUrl = await QRCode.toDataURL(qrCode);

    const emailResponse = await resend.emails.send({
      from: "Asistencia <onboarding@resend.dev>",
      to: [email],
      subject: "Tu código QR para asistencia",
      html: `
        <h1>Hola ${name}!</h1>
        <p>Aquí está tu código QR para registrar tu asistencia:</p>
        <img src="${qrDataUrl}" alt="Código QR" style="width: 200px; height: 200px;"/>
        <p>Por favor, guarda este código QR y preséntalo en cada sesión para registrar tu asistencia.</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
