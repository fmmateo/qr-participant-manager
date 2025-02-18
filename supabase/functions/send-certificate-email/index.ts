
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
    const body = await req.json();
    console.log("Recibido request:", body);

    const { 
      name, 
      email, 
      certificateNumber, 
      certificateType, 
      programType,
      programName,
      issueDate 
    }: CertificateEmailRequest = body;

    const certificateTypeText = certificateType.toLowerCase() === 'participacion' 
      ? 'PARTICIPACIÓN' 
      : certificateType === 'APROBACION' 
        ? 'APROBACIÓN' 
        : 'ASISTENCIA';

    console.log("Iniciando generación de PDF...");
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    console.log("Cargando fuentes...");
    const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // Fondo blanco
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1),
    });

    // Borde verde
    const borderMargin = 40;
    page.drawRectangle({
      x: borderMargin,
      y: borderMargin,
      width: width - (borderMargin * 2),
      height: height - (borderMargin * 2),
      borderColor: rgb(0.125, 0.502, 0.125),
      borderWidth: 2,
    });

    // Logo como texto estilizado
    const logoText = "CONACOOP";
    const logoSize = 48;
    const logoWidth = font.widthOfTextAtSize(logoText, logoSize);
    
    // Dibuja un rectángulo verde claro detrás del texto del logo
    page.drawRectangle({
      x: (width - logoWidth - 40) / 2,
      y: height - 160,
      width: logoWidth + 40,
      height: 80,
      color: rgb(0.8, 0.9, 0.8),
      borderColor: rgb(0.125, 0.502, 0.125),
      borderWidth: 2,
    });

    // Dibuja el texto del logo
    page.drawText(logoText, {
      x: (width - logoWidth) / 2,
      y: height - 120,
      size: logoSize,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Título principal
    const titleText = 'CONSEJO NACIONAL DE COOPERATIVAS';
    const textWidth = font.widthOfTextAtSize(titleText, 28);
    page.drawText(titleText, {
      x: (width - textWidth) / 2,
      y: height - 220,
      size: 28,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Certificado
    const certText = `Otorga el presente certificado de ${certificateTypeText} a:`;
    const certTextWidth = regularFont.widthOfTextAtSize(certText, 16);
    page.drawText(certText, {
      x: (width - certTextWidth) / 2,
      y: height - 320,
      size: 16,
      font: regularFont,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Nombre del participante (más grande y destacado)
    const nameWidth = font.widthOfTextAtSize(name.toUpperCase(), 36);
    page.drawText(name.toUpperCase(), {
      x: (width - nameWidth) / 2,
      y: height - 380,
      size: 36,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Tipo de programa
    const programText = `Por su ${certificateTypeText.toLowerCase()} en el ${programType.toLowerCase()}:`;
    const programTextWidth = regularFont.widthOfTextAtSize(programText, 16);
    page.drawText(programText, {
      x: (width - programTextWidth) / 2,
      y: height - 440,
      size: 16,
      font: regularFont,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Nombre del programa
    const programNameWidth = font.widthOfTextAtSize(`"${programName}"`, 24);
    page.drawText(`"${programName}"`, {
      x: (width - programNameWidth) / 2,
      y: height - 480,
      size: 24,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Información del certificado en la parte inferior
    const bottomMargin = 80;

    // Número de certificado
    page.drawText(`Certificado N°: ${certificateNumber}`, {
      x: width - 300,
      y: bottomMargin + 20,
      size: 12,
      font: regularFont,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Fecha de emisión
    page.drawText(`Fecha de emisión: ${issueDate}`, {
      x: width - 300,
      y: bottomMargin,
      size: 12,
      font: regularFont,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Firma y sello (representados como texto)
    page.drawText("FIRMA DIGITAL", {
      x: 200,
      y: bottomMargin + 60,
      size: 14,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    console.log("Guardando PDF...");
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generado exitosamente");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no está configurada");
    }

    console.log("Inicializando cliente Resend...");
    const resend = new Resend(resendApiKey);

    // Convertir el PDF a base64
    const pdfBase64 = btoa(String.fromCharCode.apply(null, pdfBytes));
    console.log("PDF convertido a base64 exitosamente");

    console.log("Enviando email...");
    const emailResponse = await resend.emails.send({
      from: "Certificados CONACOOP <onboarding@resend.dev>",
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programType}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #208020; text-align: center;">Tu Certificado CONACOOP</h1>
          <p style="color: #666;">Estimado/a ${name},</p>
          <p style="color: #666;">Adjunto encontrarás tu certificado de ${certificateType} para el ${programType.toLowerCase()} "${programName}".</p>
          <p style="color: #666;">Número de certificado: ${certificateNumber}</p>
          <p style="color: #666;">Fecha de emisión: ${issueDate}</p>
          <p style="color: #666; margin-top: 20px;">¡Felicitaciones por tu logro!</p>
        </div>
      `,
      attachments: [
        {
          filename: `certificado-${certificateNumber}.pdf`,
          content: pdfBase64,
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
