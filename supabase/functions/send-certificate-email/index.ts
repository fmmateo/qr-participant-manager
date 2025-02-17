
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

function generateCertificateSVG(data: CertificateEmailRequest): string {
  return `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <!-- Fondo blanco -->
      <rect width="1920" height="1080" fill="#FFFFFF"/>
      
      <!-- Borde ornamental -->
      <rect x="40" y="40" width="1840" height="1000" 
        fill="none" stroke="#8CC63F" stroke-width="20"/>
      
      <!-- Esquinas ornamentales -->
      <path d="M40 140 Q40 40 140 40" stroke="#8CC63F" stroke-width="5" fill="none"/>
      <path d="M1780 40 Q1880 40 1880 140" stroke="#8CC63F" stroke-width="5" fill="none"/>
      <path d="M40 940 Q40 1040 140 1040" stroke="#8CC63F" stroke-width="5" fill="none"/>
      <path d="M1780 1040 Q1880 1040 1880 940" stroke="#8CC63F" stroke-width="5" fill="none"/>
      
      <!-- Textos -->
      <text x="960" y="200" font-family="Arial" font-size="60" font-weight="bold" 
        fill="#333333" text-anchor="middle">CERTIFICADO</text>
      
      <text x="960" y="260" font-family="Arial" font-size="40" font-weight="bold" 
        fill="#8CC63F" text-anchor="middle">DE ${data.certificateType}</text>
      
      <text x="960" y="350" font-family="Arial" font-size="30" font-style="italic" 
        fill="#666666" text-anchor="middle">Se certifica que</text>
      
      <text x="960" y="450" font-family="Arial" font-size="50" font-weight="bold" 
        fill="#333333" text-anchor="middle">${data.name}</text>
      
      <text x="960" y="550" font-family="Arial" font-size="30" 
        fill="#666666" text-anchor="middle">Ha completado satisfactoriamente el ${data.programType.toLowerCase()}:</text>
      
      <text x="960" y="620" font-family="Arial" font-size="40" font-weight="bold" 
        fill="#333333" text-anchor="middle">"${data.programName}"</text>
      
      <text x="960" y="900" font-family="Arial" font-size="20" 
        fill="#888888" text-anchor="middle">Certificado N°: ${data.certificateNumber}</text>
      
      <text x="960" y="940" font-family="Arial" font-size="20" 
        fill="#888888" text-anchor="middle">Fecha de emisión: ${data.issueDate}</text>
    </svg>
  `;
}

serve(async (req) => {
  console.log("Received request to send-certificate-email");

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

    if (!name || !email || !certificateNumber || !certificateType || !programType || !programName || !issueDate) {
      console.error("Missing required fields");
      throw new Error("Missing required fields");
    }

    // Generar SVG del certificado
    const certificateSVG = generateCertificateSVG({
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate
    });

    // Codificar el SVG en base64
    const base64SVG = btoa(certificateSVG);

    console.log("Certificate SVG generated successfully");

    const emailResponse = await resend.emails.send({
      from: "noreply@resend.dev",
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programType}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Tu Certificado</h1>
          <p style="color: #666;">Estimado/a ${name},</p>
          <p style="color: #666;">Adjunto encontrarás tu certificado de ${certificateType} para el ${programType.toLowerCase()} "${programName}".</p>
          <p style="color: #666;">Número de certificado: ${certificateNumber}</p>
          <p style="color: #666;">Fecha de emisión: ${issueDate}</p>
        </div>
      `,
      attachments: [
        {
          filename: `certificado-${certificateNumber}.svg`,
          content: base64SVG,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
});
