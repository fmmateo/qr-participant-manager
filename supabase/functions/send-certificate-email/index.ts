
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    console.log("Iniciando generación de certificado:", {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate
    });

    const certificateTypeText = certificateType.toLowerCase() === 'participacion' 
      ? 'PARTICIPACIÓN' 
      : certificateType === 'APROBACION' 
        ? 'APROBACIÓN' 
        : 'ASISTENCIA';

    // Crear PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    // Fuentes
    const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // Colores
    const goldColor = rgb(0.855, 0.647, 0.125);
    const darkGreenColor = rgb(0, 0.3, 0.1);

    // Fondo
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: darkGreenColor,
    });

    // Borde
    const margin = 20;
    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - (margin * 2),
      height: height - (margin * 2),
      borderColor: goldColor,
      borderWidth: 2,
    });

    // Contenido
    page.drawText('CONSEJO NACIONAL DE COOPERATIVAS', {
      x: 50,
      y: height - 80,
      size: 28,
      font,
      color: goldColor,
    });

    page.drawText('CONAPCOOP', {
      x: 50,
      y: height - 120,
      size: 24,
      font,
      color: goldColor,
    });

    page.drawText(`Otorga el presente certificado de ${certificateTypeText} a:`, {
      x: 50,
      y: height - 200,
      size: 16,
      font: regularFont,
      color: goldColor,
    });

    page.drawText(name.toUpperCase(), {
      x: 50,
      y: height - 250,
      size: 36,
      font,
      color: goldColor,
    });

    page.drawText(`Por su ${certificateTypeText.toLowerCase()} en el ${programType.toLowerCase()}:`, {
      x: 50,
      y: height - 300,
      size: 16,
      font: regularFont,
      color: goldColor,
    });

    page.drawText(`"${programName}"`, {
      x: 50,
      y: height - 350,
      size: 24,
      font,
      color: goldColor,
    });

    page.drawText(`Certificado N°: ${certificateNumber}`, {
      x: 50,
      y: 100,
      size: 12,
      font: regularFont,
      color: goldColor,
    });

    page.drawText(`Fecha de emisión: ${issueDate}`, {
      x: 50,
      y: 80,
      size: 12,
      font: regularFont,
      color: goldColor,
    });

    const pdfBytes = await pdfDoc.save();
    console.log("PDF generado exitosamente");

    // Verificar RESEND_API_KEY
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no está configurada");
    }

    const resend = new Resend(resendApiKey);

    // En desarrollo, enviar a email de prueba
    const isDevelopment = !Deno.env.get("PRODUCTION");
    const toEmail = isDevelopment ? "fmmateo98@gmail.com" : email;

    console.log("Enviando email a:", toEmail);

    const emailResponse = await resend.emails.send({
      from: "Certificados CONAPCOOP <onboarding@resend.dev>",
      to: [toEmail],
      subject: `Tu certificado de ${certificateType} - ${programType}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #004d1a; text-align: center;">Tu Certificado CONAPCOOP</h1>
          <p style="color: #666;">Estimado/a ${name},</p>
          <p style="color: #666;">Adjunto encontrarás tu certificado de ${certificateType} para el ${programType.toLowerCase()} "${programName}".</p>
          <p style="color: #666;">Número de certificado: ${certificateNumber}</p>
          <p style="color: #666;">Fecha de emisión: ${issueDate}</p>
          <p style="color: #666; margin-top: 20px;">¡Felicitaciones por tu logro!</p>
          ${isDevelopment ? `<p style="color: red;">MODO DESARROLLO: Email original destinado a: ${email}</p>` : ''}
        </div>
      `,
      attachments: [
        {
          filename: `certificado-${certificateNumber}.pdf`,
          content: pdfBytes,
        },
      ],
    });

    console.log("Email enviado exitosamente:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en la función send-certificate-email:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
