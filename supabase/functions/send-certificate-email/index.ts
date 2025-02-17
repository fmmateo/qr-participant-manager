
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CertificateEmailRequest {
  name: string;
  email: string;
  certificateNumber: string;
  certificateType: string;
  issueDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, certificateNumber, certificateType, issueDate }: CertificateEmailRequest = await req.json();

    const getCertificateTypeText = (type: string) => {
      switch (type) {
        case "PARTICIPACION": return "Participación";
        case "APROBACION": return "Aprobación";
        case "ASISTENCIA": return "Asistencia";
        default: return type;
      }
    };

    const emailResponse = await resend.emails.send({
      from: "Certificados <onboarding@resend.dev>",
      to: [email],
      subject: `Tu certificado de ${getCertificateTypeText(certificateType)}`,
      html: `
        <h1>¡Hola ${name}!</h1>
        <p>Adjuntamos tu certificado de ${getCertificateTypeText(certificateType)}.</p>
        <p>Detalles del certificado:</p>
        <ul>
          <li>Número de certificado: ${certificateNumber}</li>
          <li>Tipo: ${getCertificateTypeText(certificateType)}</li>
          <li>Fecha de emisión: ${issueDate}</li>
        </ul>
        <p>Gracias por tu participación.</p>
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
