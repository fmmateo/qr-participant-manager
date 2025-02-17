
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import puppeteer from "npm:puppeteer-core@21.5.2";
import * as Handlebars from "npm:handlebars@4.7.8";

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
      throw new Error("Missing required fields");
    }

    // Validar el API key de Resend
    if (!Deno.env.get("RESEND_API_KEY")) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Obtener la plantilla HTML básica
    const basicTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificado</title>
        <style>
          body {
            margin: 0;
            padding: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
          }
          .certificate {
            padding: 50px;
            border: 10px solid #2D3748;
            text-align: center;
            position: relative;
            background: white;
            width: 100%;
            max-width: 800px;
          }
          .logo {
            max-width: 200px;
            margin-bottom: 30px;
          }
          h1 {
            font-size: 48px;
            color: #333;
            margin-bottom: 20px;
          }
          .participant-name {
            font-size: 36px;
            font-weight: bold;
            color: #000;
            margin: 20px 0;
          }
          .description {
            font-size: 24px;
            color: #666;
            margin: 20px 0;
            line-height: 1.5;
          }
          .certificate-number {
            font-size: 14px;
            color: #999;
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <img src="https://via.placeholder.com/200x100" alt="Logo" class="logo">
          <h1>Certificado de {{certificateType}}</h1>
          <div class="participant-name">{{participantName}}</div>
          <div class="description">
            Por haber completado el {{programType}} <br>
            "{{programName}}"
          </div>
          <div class="certificate-number">
            Certificado N°: {{certificateNumber}}<br>
            Fecha de emisión: {{issueDate}}
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Compiling certificate template");

    // Compilar la plantilla con Handlebars
    const compiledTemplate = Handlebars.compile(basicTemplate);
    const html = compiledTemplate({
      participantName: name,
      certificateType,
      programType: programType.toLowerCase(),
      programName,
      certificateNumber,
      issueDate,
    });

    console.log("Template compiled, launching browser");

    // Generar PDF
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log("Browser launched");

    const page = await browser.newPage();
    await page.setContent(html, { 
      waitUntil: ["networkidle0", "domcontentloaded"] 
    });
    console.log("Page content set");

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });
    console.log("PDF generated");

    await browser.close();
    console.log("Browser closed");

    // Enviar correo con el PDF adjunto
    const emailResponse = await resend.emails.send({
      from: "Certificados <onboarding@resend.dev>",
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programType}`,
      html: `
        <h1>¡Hola ${name}!</h1>
        <p>Adjuntamos tu certificado de ${certificateType} del ${programType.toLowerCase()} "${programName}".</p>
        <p>Puedes encontrar tu certificado adjunto a este correo.</p>
        <p>Gracias por tu participación.</p>
      `,
      attachments: [
        {
          filename: `certificado-${certificateNumber}.pdf`,
          content: pdf,
        },
      ],
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
