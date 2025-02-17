
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
      <!-- Fondo con gradiente -->
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Fondo principal -->
      <rect width="1920" height="1080" fill="url(#grad1)"/>
      
      <!-- Borde decorativo -->
      <rect x="60" y="60" width="1800" height="960" 
        fill="none" 
        stroke="#8B5CF6" 
        stroke-width="3"
        rx="20"
        filter="url(#shadow)"/>
      
      <!-- Patrón decorativo superior -->
      <path d="M100,100 Q960,50 1820,100" 
        stroke="#8B5CF6" 
        stroke-width="2" 
        fill="none"
        opacity="0.5"/>
      
      <!-- Patrón decorativo inferior -->
      <path d="M100,980 Q960,1030 1820,980" 
        stroke="#8B5CF6" 
        stroke-width="2" 
        fill="none"
        opacity="0.5"/>
      
      <!-- Título principal -->
      <text x="960" y="200" 
        font-family="Arial" 
        font-size="80" 
        font-weight="bold" 
        fill="#1F2937"
        text-anchor="middle"
        filter="url(#shadow)">
        CERTIFICADO
      </text>
      
      <!-- Subtítulo -->
      <text x="960" y="280" 
        font-family="Arial" 
        font-size="40" 
        font-weight="bold" 
        fill="#8B5CF6"
        text-anchor="middle">
        DE ${certificateTypeText}
      </text>
      
      <!-- Texto introductorio -->
      <text x="960" y="380" 
        font-family="Arial" 
        font-size="30" 
        font-style="italic" 
        fill="#4B5563"
        text-anchor="middle">
        Se certifica que
      </text>
      
      <!-- Nombre del participante -->
      <text x="960" y="480" 
        font-family="Arial" 
        font-size="60" 
        font-weight="bold" 
        fill="#1F2937"
        text-anchor="middle"
        filter="url(#shadow)">
        ${data.name}
      </text>
      
      <!-- Descripción del programa -->
      <text x="960" y="580" 
        font-family="Arial" 
        font-size="30" 
        fill="#4B5563"
        text-anchor="middle">
        Ha completado satisfactoriamente el ${data.programType.toLowerCase()}:
      </text>
      
      <!-- Nombre del programa -->
      <text x="960" y="650" 
        font-family="Arial" 
        font-size="45" 
        font-weight="bold" 
        fill="#1F2937"
        text-anchor="middle"
        filter="url(#shadow)">
        "${data.programName}"
      </text>
      
      <!-- Detalles del certificado -->
      <text x="960" y="900" 
        font-family="Arial" 
        font-size="25" 
        fill="#6B7280"
        text-anchor="middle">
        Certificado N°: ${data.certificateNumber}
      </text>
      
      <text x="960" y="940" 
        font-family="Arial" 
        font-size="25" 
        fill="#6B7280"
        text-anchor="middle">
        Fecha de emisión: ${data.issueDate}
      </text>

      <!-- Firma y sello -->
      <line x1="700" y1="800" x2="1220" y2="800" 
        stroke="#8B5CF6" 
        stroke-width="2"/>
      <text x="960" y="840" 
        font-family="Arial" 
        font-size="25" 
        fill="#4B5563"
        text-anchor="middle">
        Director Académico
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
