
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

    console.log("Generando PDF para:", name);
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

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

    console.log("Agregando contenido al PDF...");

    // Cargar y agregar el logo
    const logoUrl = "https://xmnpfnrndmwxnzkmcqkv.supabase.co/storage/v1/object/public/public/logo-conapcoop.png";
    const logoResponse = await fetch(logoUrl);
    const logoData = await logoResponse.arrayBuffer();
    const logoImage = await pdfDoc.embedPng(logoData);
    
    // Calcular dimensiones del logo para mantener proporción y centrarlo
    const logoMaxWidth = 150;
    const logoDims = logoImage.scale(logoMaxWidth / logoImage.width);
    
    page.drawImage(logoImage, {
      x: (width - logoDims.width) / 2,
      y: height - 120 - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Textos centrados
    const textWidth = font.widthOfTextAtSize('CONSEJO NACIONAL DE COOPERATIVAS', 28);
    page.drawText('CONSEJO NACIONAL DE COOPERATIVAS', {
      x: (width - textWidth) / 2,
      y: height - 200,
      size: 28,
      font,
      color: goldColor,
    });

    const subtitleWidth = font.widthOfTextAtSize('CONAPCOOP', 24);
    page.drawText('CONAPCOOP', {
      x: (width - subtitleWidth) / 2,
      y: height - 240,
      size: 24,
      font,
      color: goldColor,
    });

    const certTextWidth = regularFont.widthOfTextAtSize(`Otorga el presente certificado de ${certificateTypeText} a:`, 16);
    page.drawText(`Otorga el presente certificado de ${certificateTypeText} a:`, {
      x: (width - certTextWidth) / 2,
      y: height - 300,
      size: 16,
      font: regularFont,
      color: goldColor,
    });

    const nameWidth = font.widthOfTextAtSize(name.toUpperCase(), 36);
    page.drawText(name.toUpperCase(), {
      x: (width - nameWidth) / 2,
      y: height - 350,
      size: 36,
      font,
      color: goldColor,
    });

    const programTextWidth = regularFont.widthOfTextAtSize(`Por su ${certificateTypeText.toLowerCase()} en el ${programType.toLowerCase()}:`, 16);
    page.drawText(`Por su ${certificateTypeText.toLowerCase()} en el ${programType.toLowerCase()}:`, {
      x: (width - programTextWidth) / 2,
      y: height - 400,
      size: 16,
      font: regularFont,
      color: goldColor,
    });

    const programNameWidth = font.widthOfTextAtSize(`"${programName}"`, 24);
    page.drawText(`"${programName}"`, {
      x: (width - programNameWidth) / 2,
      y: height - 450,
      size: 24,
      font,
      color: goldColor,
    });

    // Información del certificado en la parte inferior
    const certNumberWidth = regularFont.widthOfTextAtSize(`Certificado N°: ${certificateNumber}`, 12);
    page.drawText(`Certificado N°: ${certificateNumber}`, {
      x: (width - certNumberWidth) / 2,
      y: 100,
      size: 12,
      font: regularFont,
      color: goldColor,
    });

    const dateWidth = regularFont.widthOfTextAtSize(`Fecha de emisión: ${issueDate}`, 12);
    page.drawText(`Fecha de emisión: ${issueDate}`, {
      x: (width - dateWidth) / 2,
      y: 80,
      size: 12,
      font: regularFont,
      color: goldColor,
    });

    console.log("Guardando PDF...");
    const pdfBytes = await pdfDoc.save();
    console.log("PDF generado exitosamente");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY no está configurada");
    }

    const resend = new Resend(resendApiKey);
    console.log("Cliente Resend inicializado");

    // Convertir el PDF a base64
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));
    console.log("PDF convertido a base64");

    const emailResponse = await resend.emails.send({
      from: "Certificados CONAPCOOP <onboarding@resend.dev>",
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
          filename: `certificado-${certificateNumber}.pdf`,
          content: pdfBase64,
          type: 'application/pdf'
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
