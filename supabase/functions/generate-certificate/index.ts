
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import PDFDocument from "npm:pdfkit";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
      issueDate,
      design
    } = await req.json();

    console.log('Recibidos datos del certificado:', {
      name,
      email,
      certificateNumber,
      programName
    });

    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan datos requeridos para generar el certificado');
    }

    // Crear el PDF
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 0
    });

    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Promesa para esperar a que el PDF se complete
    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = new Uint8Array(Buffer.concat(chunks));
        resolve(pdfBuffer);
      });
    });

    // Configurar fuentes y estilos
    doc.font('Times-Roman');

    // Dibujar borde dorado
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(15)
       .strokeColor('#b8860b');
    doc.stroke();

    // Logo de la empresa (si está disponible)
    if (design.design_params?.logo_url?.url) {
      doc.image(
        design.design_params.logo_url.url,
        doc.page.width / 2 - 75,
        50,
        { width: 150 }
      );
    }

    // Título
    doc.fontSize(42)
       .fillColor('#b8860b')
       .text('CERTIFICADO PROFESIONAL', 0, 150, {
         align: 'center'
       });

    // Contenido principal
    doc.fontSize(20)
       .fillColor('#444444')
       .text('Por medio de la presente, se certifica que:', {
         align: 'center'
       })
       .moveDown();

    doc.fontSize(32)
       .fillColor('#333333')
       .text(name, {
         align: 'center'
       })
       .moveDown();

    doc.fontSize(20)
       .text('Ha completado exitosamente el programa:', {
         align: 'center'
       })
       .moveDown();

    doc.fontSize(24)
       .text(programName, {
         align: 'center'
       })
       .moveDown();

    doc.fontSize(18)
       .text('Habiendo demostrado los conocimientos y competencias requeridas para su aprobación, cumpliendo con todos los requisitos establecidos por la institución.', {
         align: 'center',
         width: 500,
         align: 'center'
       })
       .moveDown();

    doc.fontSize(20)
       .text(`Fecha de emisión: ${issueDate}`, {
         align: 'center'
       });

    // Firma
    if (design.design_params?.signature_url?.url) {
      doc.image(
        design.design_params.signature_url.url,
        doc.page.width / 2 - 100,
        doc.page.height - 200,
        { width: 200 }
      );
    }

    doc.fontSize(18)
       .text('Director Académico', 
         doc.page.width / 2 - 150,
         doc.page.height - 120,
         { width: 300, align: 'center' });

    // QR Code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(certificateNumber)}`;
    doc.image(
      qrUrl,
      doc.page.width - 150,
      doc.page.height - 180,
      { width: 120 }
    );

    doc.fontSize(14)
       .text('Código de verificación:',
         doc.page.width - 200,
         doc.page.height - 50,
         { width: 200, align: 'right' })
       .text(certificateNumber,
         doc.page.width - 200,
         doc.page.height - 35,
         { width: 200, align: 'right' });

    // Finalizar el PDF
    doc.end();

    // Esperar a que el PDF se complete
    const pdfBuffer = await pdfPromise;

    // Enviar el correo con el PDF adjunto
    const emailResponse = await resend.emails.send({
      from: 'Certificados <certificados@resend.dev>',
      to: [email],
      subject: `Tu certificado de ${programName}`,
      html: `
        <h1>¡Felicitaciones ${name}!</h1>
        <p>Adjunto encontrarás tu certificado de ${certificateType} para el programa ${programName}.</p>
        <p>Código de verificación: ${certificateNumber}</p>
      `,
      attachments: [{
        filename: `certificado-${certificateNumber}.pdf`,
        content: pdfBuffer
      }]
    });

    console.log('Respuesta del envío de correo:', emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        id: emailResponse.id,
        certificateUrl: `https://example.com/certificates/${certificateNumber}`,
        verificationUrl: `https://example.com/verify/${certificateNumber}`
      }),
      {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error en generate-certificate:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
