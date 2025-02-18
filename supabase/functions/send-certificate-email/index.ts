
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

serve(async (req) => {
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

    console.log("Procesando solicitud de certificado para:", {
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

    console.log("Generando PDF del certificado...");

    // Crear un nuevo documento PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 en puntos (landscape)
    
    // Cargar la fuente
    const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    
    // Configurar el tamaño y la posición del texto
    const { width, height } = page.getSize();
    
    // Color dorado para el texto principal
    const goldColor = rgb(0.855, 0.647, 0.125);
    const whiteColor = rgb(1, 1, 1);
    
    // Título
    page.drawText('CONSEJO NACIONAL DE COOPERATIVAS', {
      x: 50,
      y: height - 50,
      size: 24,
      font,
      color: goldColor,
      maxWidth: width - 100,
      lineHeight: 30,
    });
    
    // Subtítulo
    page.drawText('CONAPCOOP', {
      x: 50,
      y: height - 100,
      size: 20,
      font,
      color: goldColor,
    });
    
    // Texto del certificado
    page.drawText(`Otorga el presente certificado de ${certificateTypeText} a:`, {
      x: 50,
      y: height - 180,
      size: 16,
      font: regularFont,
      color: whiteColor,
    });
    
    // Nombre del participante
    page.drawText(name.toUpperCase(), {
      x: 50,
      y: height - 250,
      size: 32,
      font,
      color: goldColor,
    });
    
    // Detalles del programa
    page.drawText(`Por su ${certificateTypeText.toLowerCase()} en el ${programType.toLowerCase()}:`, {
      x: 50,
      y: height - 300,
      size: 16,
      font: regularFont,
      color: whiteColor,
    });
    
    page.drawText(`"${programName}"`, {
      x: 50,
      y: height - 350,
      size: 20,
      font,
      color: goldColor,
      maxWidth: width - 100,
      lineHeight: 30,
    });
    
    // Información del certificado
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
    
    // Generar el PDF
    const pdfBytes = await pdfDoc.save();
    console.log("PDF del certificado generado exitosamente");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // En modo desarrollo/pruebas, enviamos solo a la dirección verificada
    const isDevelopment = !Deno.env.get("PRODUCTION");
    const toEmail = isDevelopment ? "fmmateo98@gmail.com" : email;

    console.log("Enviando certificado por email a:", toEmail);
    
    const emailResponse = await resend.emails.send({
      from: "Certificados <onboarding@resend.dev>",
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
          content: pdfBytes
        },
      ],
    });

    console.log("Email enviado exitosamente:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en send-certificate-email:", error);
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
