
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer";
import PDFDocument from "npm:pdfkit";

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

    console.log('Recibiendo solicitud de generación de certificado:', {
      certificateNumber,
      email,
      programName,
      design
    });

    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan datos requeridos para generar el certificado');
    }

    // Configurar transporte SMTP
    const transporter = nodemailer.createTransport({
      host: Deno.env.get("SMTP_HOST"),
      port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
      secure: Deno.env.get("SMTP_SECURE") === "true",
      auth: {
        user: Deno.env.get("SMTP_USER"),
        pass: Deno.env.get("SMTP_PASS")
      }
    });

    // Generar PDF
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

    // Logo de la empresa
    if (design?.logo_url?.url) {
      try {
        console.log('Cargando logo desde:', design.logo_url.url);
        const logoResponse = await fetch(design.logo_url.url);
        const logoBuffer = await logoResponse.arrayBuffer();
        doc.image(
          new Uint8Array(logoBuffer),
          doc.page.width / 2 - 75,
          50,
          { width: 150 }
        );
      } catch (error) {
        console.error('Error al cargar el logo:', error);
      }
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
         width: 500
       })
       .moveDown();

    doc.fontSize(20)
       .text(`Fecha de emisión: ${issueDate}`, {
         align: 'center'
       });

    // Firma
    if (design?.signature_url?.url) {
      try {
        console.log('Cargando firma desde:', design.signature_url.url);
        const signatureResponse = await fetch(design.signature_url.url);
        const signatureBuffer = await signatureResponse.arrayBuffer();
        doc.image(
          new Uint8Array(signatureBuffer),
          doc.page.width / 2 - 100,
          doc.page.height - 200,
          { width: 200 }
        );
      } catch (error) {
        console.error('Error al cargar la firma:', error);
      }
    }

    doc.fontSize(18)
       .text('Director Académico', 
         doc.page.width / 2 - 150,
         doc.page.height - 120,
         { width: 300, align: 'center' });

    // QR Code
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(certificateNumber)}`;
      const qrResponse = await fetch(qrUrl);
      const qrBuffer = await qrResponse.arrayBuffer();
      doc.image(
        new Uint8Array(qrBuffer),
        doc.page.width - 150,
        doc.page.height - 180,
        { width: 120 }
      );
    } catch (error) {
      console.error('Error al generar código QR:', error);
    }

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
    console.log('Enviando correo electrónico...');
    
    const info = await transporter.sendMail({
      from: `"Certificados" <${Deno.env.get("SMTP_USER")}>`,
      to: email,
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

    console.log('Correo enviado exitosamente:', info.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        id: info.messageId,
        verificationUrl: `https://certificados.example.com/verify/${certificateNumber}`
      }),
      {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Error detallado en generate-certificate:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido al generar el certificado'
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
