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

    // Logo base64 del CONACOOP - Este es un logo temporal verde simple
    const logoBase64 = `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DwyW0IdwfeQ75fvd1A+M7BCPCyLtdiOVMhXHNNEK6nu2Ur4UGNE4B3EV4ptkBBeCKwA7gFeC35vE9wDuErgkeAl3e5FsuRvyaMxX8B3bGJ8ALRnYSBN83m4jTC24L7gf8CTu9qNc+2hTC24X7gtV2uxXLgTwinpp3WR5j8Yy+hnZuDf2FOJlwOPEp4bXddV6t5tjMIY/odIlxumUE4vT1Bh4dlqhAGw9hP+MtR5keaWRkiTC5yL+GEpAhv3q0lfOJshPDOwIou12NddhGhZVkWwT9AeOV4D/B2ivGqbV4tBj5KGH/gJorxyvA6wpuDh/A7BT3tDYTBNVLvSIuBTxCuzT5C6GRj6VUJw5PdTniPIe9j8Q0TXhYaJ7xYZD3oWuAwaffYlYTT/kcJPfdO6eD6e0mV0KzjdsIDvjw3g60RnqpMAH/U5VqsC95H2GlT7UQ14G3AE4S/+md2cN29qkLolnwb4fIpz+8xVAgfPplsbs16wNsIAZniot8C4N2EvgdfIDwSs85aAHyQ8GLQ75HvtmBvJZx1vL3LtVgHvZnQnTflF2OeRxhg4xZCk0vrjhrh5uxtFKPX36cIbwFe3eVarAOuINykS3Xa9nxC994H8E6UF1XgzYQbaUV4G/AGwjcTX9PlWiyh8whz8KU4bVtP6M//GGGI7byfLva6KvAGQoefm8j/24CXE0YhWt/lWiyB0whT7c63O+8Q4bT/KcLdfQd/MbwGuJ/wmDPvlwBnEb6jsLrLtViblhBu+M2nO28f4fHeLsLQW74BVSyvBu4m3OPJ+/cE1xFmJFra5VqsDf2EHe/xefyZ1xNG7/k+4ROutyasu9uqhC/pDgPvJHxCK2+qhCHlHyO8EpznS6YqYbCRHxOOlU73GbAMVYD/JIzWO1tDhL7+ewjfcru0Q3V12wLCqC6PEb5L8BTC6W+eLAD+jNCj8b2Ey4K82UjoIPUw4VixtPL6LvgQYbDJ7zR/rgLnEmbP2U7YOD/YvdI6rkq413EH4QD4S+A8wvsMeTFImPDjMcL9kLxNE7aO8IHSB4E/J99nMLk30O0CWlElbPDrCR8qeJgQ7NsIp/i7CXe1y2qAcH/jIsI1/suAtc3/t58wW1HeDANXEb6n+EPCsZEn6wmjNi8hJORPSXdDtLQc/GZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmadUul2AWZWyBlzKhVPb2hmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZpaP/wfpMCAq2+YgZQAAAABJRU5ErkJggg==`;

    try {
      console.log("Procesando logo base64...");
      const logoBase64Data = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));
      console.log("Logo decodificado, convirtiendo a PNG...");
      const logoImage = await pdfDoc.embedPng(logoBase64Data);
      console.log("Logo embebido exitosamente");
      
      // Calcular dimensiones del logo para mantener proporción y centrarlo
      const logoMaxHeight = 120; // Altura máxima del logo
      const scale = logoMaxHeight / logoImage.height;
      const scaledWidth = logoImage.width * scale;
      
      // Posicionar el logo en la parte superior centrada
      page.drawImage(logoImage, {
        x: (width - scaledWidth) / 2,
        y: height - 180, // Posición desde arriba
        width: scaledWidth,
        height: logoMaxHeight,
      });
      console.log("Logo agregado exitosamente al PDF");
    } catch (logoError) {
      console.error("Error detallado al cargar el logo:", logoError);
      console.error("Stack trace:", logoError.stack);
    }

    // Título principal
    const titleText = 'CONSEJO NACIONAL DE COOPERATIVAS';
    const textWidth = font.widthOfTextAtSize(titleText, 28);
    page.drawText(titleText, {
      x: (width - textWidth) / 2,
      y: height - 220, // Ajustado para no solaparse con el logo
      size: 28,
      font,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Subtítulo
    const subtitleWidth = font.widthOfTextAtSize('CONACOOP', 24);
    page.drawText('CONACOOP', {
      x: (width - subtitleWidth) / 2,
      y: height - 260, // Espaciado adicional
      size: 24,
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

    // Información del certificado en la parte inferior derecha
    const rightMargin = 80; // Margen desde el borde derecho

    // Número de certificado
    page.drawText(`Certificado N°: ${certificateNumber}`, {
      x: width - rightMargin - font.widthOfTextAtSize(`Certificado N°: ${certificateNumber}`, 12),
      y: 100,
      size: 12,
      font: regularFont,
      color: rgb(0.125, 0.502, 0.125),
    });

    // Fecha de emisión
    page.drawText(`Fecha de emisión: ${issueDate}`, {
      x: width - rightMargin - font.widthOfTextAtSize(`Fecha de emisión: ${issueDate}`, 12),
      y: 80,
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
