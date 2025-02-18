
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

    // Colores actualizados según la imagen
    const lightGreenColor = rgb(0.678, 0.847, 0.302); // Color verde claro del borde
    const darkGreenColor = rgb(0.125, 0.502, 0.125); // Color verde oscuro para textos
    const backgroundColor = rgb(1, 1, 1); // Fondo blanco

    // Fondo blanco
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: backgroundColor,
    });

    // Borde decorativo verde claro
    const borderMargin = 40;
    const cornerSize = 80;
    
    // Líneas principales del borde
    page.drawRectangle({
      x: borderMargin,
      y: borderMargin,
      width: width - (borderMargin * 2),
      height: height - (borderMargin * 2),
      borderColor: lightGreenColor,
      borderWidth: 2,
    });

    // Elementos decorativos en las esquinas (similar a la imagen)
    const drawCornerDecoration = (x: number, y: number, rotate: boolean = false) => {
      page.drawSvgPath(`M 0 0 Q 20 0 40 20 Q 60 40 60 60`, {
        x,
        y,
        borderColor: lightGreenColor,
        color: lightGreenColor,
        rotate: rotate ? Math.PI : 0,
        scale: 1,
      });
    };

    // Dibujar las decoraciones en las cuatro esquinas
    drawCornerDecoration(borderMargin, height - borderMargin - cornerSize);
    drawCornerDecoration(width - borderMargin - cornerSize, height - borderMargin - cornerSize);
    drawCornerDecoration(borderMargin, borderMargin + cornerSize, true);
    drawCornerDecoration(width - borderMargin - cornerSize, borderMargin + cornerSize, true);

    // Cargar y agregar el logo nuevo
    try {
      console.log("Cargando logo...");
      const logoUrl = "public/lovable-uploads/dac3819a-b161-4058-9f3f-8bfe0d9adfa3.png";
      const logoResponse = await fetch(logoUrl);
      
      if (!logoResponse.ok) {
        throw new Error(`Error al cargar el logo: ${logoResponse.status}`);
      }
      
      const logoData = await logoResponse.arrayBuffer();
      const logoImage = await pdfDoc.embedPng(logoData);
      
      // Calcular dimensiones del logo para mantener proporción y centrarlo
      const logoMaxWidth = 100;
      const logoDims = logoImage.scale(logoMaxWidth / logoImage.width);
      
      page.drawImage(logoImage, {
        x: (width - logoDims.width) / 2,
        y: height - 180 - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
      console.log("Logo agregado exitosamente");
    } catch (logoError) {
      console.error("Error al cargar el logo:", logoError);
    }

    // Textos centrados con el nuevo estilo
    const titleText = 'CONSEJO NACIONAL DE COOPERATIVAS';
    const textWidth = font.widthOfTextAtSize(titleText, 28);
    page.drawText(titleText, {
      x: (width - textWidth) / 2,
      y: height - 260,
      size: 28,
      font,
      color: darkGreenColor,
    });

    const subtitleWidth = font.widthOfTextAtSize('CONACOOP', 24);
    page.drawText('CONACOOP', {
      x: (width - subtitleWidth) / 2,
      y: height - 300,
      size: 24,
      font,
      color: darkGreenColor,
    });

    // Texto "La Integración es Fortaleza" en rojo
    const sloganText = 'La Integración es Fortaleza';
    const sloganWidth = regularFont.widthOfTextAtSize(sloganText, 16);
    page.drawText(sloganText, {
      x: (width - sloganWidth) / 2,
      y: height - 330,
      size: 16,
      font: regularFont,
      color: rgb(0.8, 0.2, 0.2), // Color rojo para el slogan
    });

    // Certificado
    const certText = `Otorga el presente certificado de ${certificateTypeText} a:`;
    const certTextWidth = regularFont.widthOfTextAtSize(certText, 16);
    page.drawText(certText, {
      x: (width - certTextWidth) / 2,
      y: height - 380,
      size: 16,
      font: regularFont,
      color: darkGreenColor,
    });

    // Nombre del participante
    const nameWidth = font.widthOfTextAtSize(name.toUpperCase(), 36);
    page.drawText(name.toUpperCase(), {
      x: (width - nameWidth) / 2,
      y: height - 430,
      size: 36,
      font,
      color: darkGreenColor,
    });

    // Tipo de programa
    const programText = `Por su ${certificateTypeText.toLowerCase()} en el ${programType.toLowerCase()}:`;
    const programTextWidth = regularFont.widthOfTextAtSize(programText, 16);
    page.drawText(programText, {
      x: (width - programTextWidth) / 2,
      y: height - 480,
      size: 16,
      font: regularFont,
      color: darkGreenColor,
    });

    // Nombre del programa
    const programNameWidth = font.widthOfTextAtSize(`"${programName}"`, 24);
    page.drawText(`"${programName}"`, {
      x: (width - programNameWidth) / 2,
      y: height - 520,
      size: 24,
      font,
      color: darkGreenColor,
    });

    // Información del certificado en la parte inferior
    const certNumberWidth = regularFont.widthOfTextAtSize(`Certificado N°: ${certificateNumber}`, 12);
    page.drawText(`Certificado N°: ${certificateNumber}`, {
      x: (width - certNumberWidth) / 2,
      y: 100,
      size: 12,
      font: regularFont,
      color: darkGreenColor,
    });

    const dateWidth = regularFont.widthOfTextAtSize(`Fecha de emisión: ${issueDate}`, 12);
    page.drawText(`Fecha de emisión: ${issueDate}`, {
      x: (width - dateWidth) / 2,
      y: 80,
      size: 12,
      font: regularFont,
      color: darkGreenColor,
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
    const uint8Array = new Uint8Array(pdfBytes);
    const pdfBase64 = btoa(String.fromCharCode.apply(null, uint8Array));
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
