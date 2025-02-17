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
  const certificateTypeText = data.certificateType.toLowerCase() === 'participacion' 
    ? 'PARTICIPACIÓN' 
    : data.certificateType === 'APROBACION' 
      ? 'APROBACIÓN' 
      : 'ASISTENCIA';

  return `
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FFF7C2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="greenBackground" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#004d1a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#006622;stop-opacity:1" />
        </linearGradient>
      </defs>

      <rect width="1920" height="1080" fill="url(#greenBackground)"/>
      
      <rect x="40" y="40" width="1840" height="1000" 
        fill="none" 
        stroke="url(#goldBorder)" 
        stroke-width="4"/>

      <image x="20" y="20" width="200" height="200" href="data:image/png;base64,${Deno.env.get("CORNER_DECORATION")}" />
      <image x="1700" y="20" width="200" height="200" transform="scale(-1,1) translate(-3600,0)" href="data:image/png;base64,${Deno.env.get("CORNER_DECORATION")}" />
      <image x="20" y="860" width="200" height="200" transform="scale(1,-1) translate(0,-1920)" href="data:image/png;base64,${Deno.env.get("CORNER_DECORATION")}" />
      <image x="1700" y="860" width="200" height="200" transform="scale(-1,-1) translate(-3600,-1920)" href="data:image/png;base64,${Deno.env.get("CORNER_DECORATION")}" />

      <image x="810" y="80" width="300" height="300" href="data:image/png;base64,${Deno.env.get("CONAPCOOP_LOGO")}" />

      <text x="960" y="420" 
        font-family="Arial" 
        font-size="50" 
        font-weight="bold" 
        fill="#FFD700"
        text-anchor="middle">
        CONSEJO NACIONAL DE COOPERATIVAS
      </text>
      
      <text x="960" y="480" 
        font-family="Arial" 
        font-size="60" 
        font-weight="bold" 
        fill="#FFD700"
        text-anchor="middle">
        CONAPCOOP
      </text>

      <text x="960" y="580" 
        font-family="Arial" 
        font-size="40" 
        font-weight="bold" 
        fill="#FFFFFF"
        text-anchor="middle">
        Otorga el presente certificado de ${certificateTypeText} a:
      </text>

      <text x="960" y="680" 
        font-family="Arial" 
        font-size="60" 
        font-weight="bold" 
        fill="#FFD700"
        text-anchor="middle">
        ${data.name}
      </text>

      <text x="960" y="780" 
        font-family="Arial" 
        font-size="35" 
        fill="#FFFFFF"
        text-anchor="middle">
        Por su ${certificateTypeText.toLowerCase()} en el ${data.programType.toLowerCase()}:
      </text>

      <text x="960" y="850" 
        font-family="Arial" 
        font-size="45" 
        font-weight="bold" 
        fill="#FFD700"
        text-anchor="middle">
        "${data.programName}"
      </text>

      <text x="960" y="950" 
        font-family="Arial" 
        font-size="25" 
        fill="#FFFFFF"
        text-anchor="middle">
        Certificado N°: ${data.certificateNumber} | Fecha de emisión: ${data.issueDate}
      </text>
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

    const certificateSVG = generateCertificateSVG({
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate
    });

    const base64SVG = btoa(certificateSVG);

    console.log("Certificate SVG generated successfully");

    const emailResponse = await resend.emails.send({
      from: "noreply@resend.dev",
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programType}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #004d1a; text-align: center;">Tu Certificado CONAPCOOP</h1>
          <p style="color: #666;">Estimado/a ${name},</p>
          <p style="color: #666;">Adjunto encontrarás tu certificado de ${certificateType} para el ${programType.toLowerCase()} "${programName}".</p>
          <p style="color: #666;">Número de certificado: ${certificateNumber}</p>
          <p style="color: #666;">Fecha de emisión: ${issueDate}</p>
          <p style="color: #666; margin-top: 20px;">¡Felicitaciones por tu logro!</p>
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
