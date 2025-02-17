
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { Canvas, loadImage } from "npm:@napi-rs/canvas";

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

async function generateCertificateImage(data: CertificateEmailRequest): Promise<Buffer> {
  const canvas = new Canvas(1920, 1080);
  const ctx = canvas.getContext("2d");

  // Establecer fondo blanco
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 1920, 1080);

  // Dibujar borde ornamental verde
  ctx.strokeStyle = "#8CC63F"; // Color verde del logo
  ctx.lineWidth = 20;
  ctx.strokeRect(40, 40, 1840, 1000);

  // Dibujar esquinas ornamentales
  const cornerSize = 100;
  const corners = [
    [40, 40], // Esquina superior izquierda
    [1880 - cornerSize, 40], // Esquina superior derecha
    [40, 1040 - cornerSize], // Esquina inferior izquierda
    [1880 - cornerSize, 1040 - cornerSize], // Esquina inferior derecha
  ];

  corners.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + cornerSize);
    ctx.quadraticCurveTo(x, y, x + cornerSize, y);
    ctx.strokeStyle = "#8CC63F";
    ctx.lineWidth = 5;
    ctx.stroke();
  });

  // Configurar estilos de texto
  ctx.textAlign = "center";
  ctx.fillStyle = "#333333";

  // Título
  ctx.font = "bold 60px Arial";
  ctx.fillText("CERTIFICADO", 960, 200);

  // Tipo de Certificado
  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#8CC63F";
  ctx.fillText(`DE ${data.certificateType}`, 960, 260);

  // Otorgado a
  ctx.font = "italic 30px Arial";
  ctx.fillStyle = "#666666";
  ctx.fillText("Se certifica que", 960, 350);

  // Nombre del participante
  ctx.font = "bold 50px Arial";
  ctx.fillStyle = "#333333";
  ctx.fillText(data.name, 960, 450);

  // Descripción del programa
  ctx.font = "30px Arial";
  ctx.fillStyle = "#666666";
  ctx.fillText(`Ha completado satisfactoriamente el ${data.programType.toLowerCase()}:`, 960, 550);
  
  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#333333";
  ctx.fillText(`"${data.programName}"`, 960, 620);

  // Información adicional
  ctx.font = "20px Arial";
  ctx.fillStyle = "#888888";
  ctx.fillText(`Certificado N°: ${data.certificateNumber}`, 960, 900);
  ctx.fillText(`Fecha de emisión: ${data.issueDate}`, 960, 940);

  return canvas.toBuffer("image/png");
}

serve(async (req) => {
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

    // Generar imagen del certificado
    const certificateImage = await generateCertificateImage({
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate
    });

    // Codificar la imagen en base64
    const base64Image = certificateImage.toString('base64');

    console.log("Certificate image generated successfully");

    // Enviar correo con el certificado
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
          filename: `certificado-${certificateNumber}.png`,
          content: base64Image,
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
