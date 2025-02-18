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

    // Fondo blanco y borde verde
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1),
    });

    const borderMargin = 40;
    page.drawRectangle({
      x: borderMargin,
      y: borderMargin,
      width: width - (borderMargin * 2),
      height: height - (borderMargin * 2),
      borderColor: rgb(0.125, 0.502, 0.125),
      borderWidth: 2,
    });

    // Logo - Ajustado más arriba
    const centerX = width / 2;
    const centerY = height - 80; // Movido más arriba
    const size = 100;

    // Círculo exterior verde
    page.drawCircle({
      x: centerX,
      y: centerY,
      radius: size / 2,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Círculo interior amarillo
    page.drawCircle({
      x: centerX,
      y: centerY,
      radius: size / 2.5,
      color: rgb(1, 0.843, 0),
    });

    // Flechas estilizadas
    const arrowSize = size / 3;
    
    // Triángulos blancos
    page.drawRectangle({
      x: centerX - arrowSize - 10,
      y: centerY - arrowSize / 2,
      width: arrowSize,
      height: arrowSize,
      color: rgb(1, 1, 1),
      rotate: { type: 'degrees', angle: 45 },
    });

    page.drawRectangle({
      x: centerX + 10,
      y: centerY - arrowSize / 2,
      width: arrowSize,
      height: arrowSize,
      color: rgb(1, 1, 1),
      rotate: { type: 'degrees', angle: 45 },
    });

    // Título principal - Ajustado más arriba
    const titleText = 'CONSEJO NACIONAL DE COOPERATIVAS';
    const textWidth = font.widthOfTextAtSize(titleText, 28);
    page.drawText(titleText, {
      x: (width - textWidth) / 2,
      y: height - 180, // Movido más arriba
      size: 28,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Subtítulo CONACOOP - Ajustado más arriba
    const subtitleWidth = font.widthOfTextAtSize('CONACOOP', 24);
    page.drawText('CONACOOP', {
      x: (width - subtitleWidth) / 2,
      y: height - 220, // Movido más arriba
      size: 24,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Texto del certificado - Ajustado más arriba
    const certText = `Otorga el presente certificado de ${certificateTypeText} a:`;
    const certTextWidth = regularFont.widthOfTextAtSize(certText, 16);
    page.drawText(certText, {
      x: (width - certTextWidth) / 2,
      y: height - 280, // Movido más arriba
      size: 16,
      font: regularFont,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Nombre del participante - Ajustado más arriba
    const nameWidth = font.widthOfTextAtSize(name.toUpperCase(), 36);
    page.drawText(name.toUpperCase(), {
      x: (width - nameWidth) / 2,
      y: height - 340, // Movido más arriba
      size: 36,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Tipo de programa - Ajustado más arriba
    const programText = `Por su ${certificateTypeText.toLowerCase()} en el ${programType.toLowerCase()}:`;
    const programTextWidth = regularFont.widthOfTextAtSize(programText, 16);
    page.drawText(programText, {
      x: (width - programTextWidth) / 2,
      y: height - 400, // Movido más arriba
      size: 16,
      font: regularFont,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Nombre del programa - Ajustado más arriba
    const programNameWidth = font.widthOfTextAtSize(`"${programName}"`, 24);
    page.drawText(`"${programName}"`, {
      x: (width - programNameWidth) / 2,
      y: height - 440, // Movido más arriba
      size: 24,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Información adicional en la parte inferior
    const bottomY = 120; // Ajustado ligeramente más arriba
    
    page.drawText(`Certificado N°: ${certificateNumber}`, {
      x: width - 300,
      y: bottomY + 40,
      size: 12,
      font: regularFont,
      color: rgb(0.125, 0.502, 0.125),
    });

    page.drawText(`Fecha de emisión: ${issueDate}`, {
      x: width - 300,
      y: bottomY + 20,
      size: 12,
      font: regularFont,
      color: rgb(0.125, 0.502, 0.125),
    });

    const signatureText = "FIRMA DIGITAL CONACOOP";
    page.drawText(signatureText, {
      x: 150,
      y: bottomY + 20,
      size: 12,
      font: regularFont,
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

    // Enviar email con el logo incrustado en el HTML
    console.log("Enviando email...");
    const emailResponse = await resend.emails.send({
      from: "Certificados CONACOOP <onboarding@resend.dev>",
      to: [email],
      subject: `Tu certificado de ${certificateType} - ${programType}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="#208020"/>
              <circle cx="50" cy="50" r="40" fill="#FFD700"/>
              <rect x="30" y="35" width="15" height="30" fill="white" transform="rotate(45, 37.5, 50)"/>
              <rect x="55" y="35" width="15" height="30" fill="white" transform="rotate(-45, 62.5, 50)"/>
            </svg>
          </div>
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
