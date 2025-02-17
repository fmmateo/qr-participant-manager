
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
  programType: string;
  programName: string;
  issueDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send-certificate-email");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      email, 
      certificateNumber, 
      certificateType, 
      programType,
      programName,
      issueDate 
    }: CertificateEmailRequest = await req.json();

    console.log("Processing certificate request for:", {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate
    });

    // Validar campos requeridos
    if (!name || !email || !certificateNumber || !certificateType || !programType || !programName || !issueDate) {
      console.error("Missing required fields");
      throw new Error("Missing required fields");
    }

    // Validar el API key de Resend
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }
    console.log("RESEND_API_KEY is configured");

    console.log("Attempting to send email...");
    // Enviar correo con el certificado en HTML
    const emailResponse = await resend.emails.send({
      from: "noreply@resend.dev",
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programType}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Certificado</title>
        </head>
        <body style="margin: 0; padding: 40px; font-family: Arial, sans-serif;">
          <div style="max-width: 800px; margin: 0 auto; padding: 50px; border: 10px solid #2D3748; text-align: center; background: white;">
            <h1 style="font-size: 48px; color: #333; margin-bottom: 20px;">Certificado de ${certificateType}</h1>
            
            <div style="font-size: 36px; font-weight: bold; color: #000; margin: 20px 0;">
              ${name}
            </div>
            
            <div style="font-size: 24px; color: #666; margin: 20px 0; line-height: 1.5;">
              Por haber completado el ${programType.toLowerCase()} <br>
              "${programName}"
            </div>
            
            <div style="font-size: 14px; color: #999; margin-top: 40px;">
              Certificado N°: ${certificateNumber}<br>
              Fecha de emisión: ${issueDate}
            </div>
          </div>
          
          <div style="max-width: 600px; margin: 20px auto; text-align: center; color: #666;">
            <p>Este certificado ha sido emitido electrónicamente y es válido sin firma.</p>
            <p>Puedes verificar la autenticidad de este certificado con el número: ${certificateNumber}</p>
          </div>
        </body>
        </html>
      `
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
    console.error("Error in send-certificate-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error desconocido",
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
