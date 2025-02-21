
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

    console.log('Datos recibidos:', {
      name,
      email,
      certificateNumber,
      programName,
      designParams: design?.design_params
    });

    // Validar datos requeridos
    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan datos requeridos para generar el certificado');
    }

    // Configuración SMTP
    const smtpConfig = {
      host: Deno.env.get("SMTP_HOST"),
      port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
      secure: Deno.env.get("SMTP_SECURE") === "true",
      auth: {
        user: Deno.env.get("SMTP_USER"),
        pass: Deno.env.get("SMTP_PASS")
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    console.log('Configuración SMTP:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user
    });

    // Crear transporte SMTP
    const transporter = nodemailer.createTransport(smtpConfig);

    // Verificar conexión SMTP
    try {
      await transporter.verify();
      console.log('Conexión SMTP verificada exitosamente');
    } catch (smtpError: any) {
      console.error('Error de conexión SMTP:', smtpError.message);
      throw new Error(`Error de conexión SMTP: ${smtpError.message}`);
    }

    // Generar PDF
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 0
    });

    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = new Uint8Array(Buffer.concat(chunks));
        resolve(pdfBuffer);
      });
    });

    // Configurar diseño del PDF
    doc.font('Times-Roman');

    // Borde dorado
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(15)
       .strokeColor('#b8860b');
    doc.stroke();

    // Logo
    const logoUrl = design?.design_params?.logo_url?.url;
    if (logoUrl) {
      try {
        console.log('Cargando logo desde:', logoUrl);
        const logoResponse = await fetch(logoUrl);
        if (!logoResponse.ok) throw new Error('Error al cargar el logo');
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

    // Título personalizado o predeterminado
    const titleText = design?.design_params?.title?.text || 'CERTIFICADO PROFESIONAL';
    doc.fontSize(42)
       .fillColor('#b8860b')
       .text(titleText, 0, 150, {
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
       .text(`Ha completado exitosamente el ${programType}:`, {
         align: 'center'
       })
       .moveDown();

    doc.fontSize(24)
       .text(programName, {
         align: 'center'
       })
       .moveDown();

    doc.fontSize(18)
       .text(`Certificado de ${certificateType}`, {
         align: 'center'
       })
       .moveDown();

    doc.fontSize(20)
       .text(`Fecha de emisión: ${issueDate}`, {
         align: 'center'
       });

    // Firma
    const signatureUrl = design?.design_params?.signature_url?.url;
    if (signatureUrl) {
      try {
        console.log('Cargando firma desde:', signatureUrl);
        const signatureResponse = await fetch(signatureUrl);
        if (!signatureResponse.ok) throw new Error('Error al cargar la firma');
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

    // Código QR
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(certificateNumber)}`;
      const qrResponse = await fetch(qrUrl);
      if (!qrResponse.ok) throw new Error('Error al generar QR');
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

    // Código de verificación
    doc.fontSize(14)
       .text('Código de verificación:',
         doc.page.width - 200,
         doc.page.height - 50,
         { width: 200, align: 'right' })
       .text(certificateNumber,
         doc.page.width - 200,
         doc.page.height - 35,
         { width: 200, align: 'right' });

    // Finalizar PDF
    doc.end();

    // Esperar a que se genere el PDF
    const pdfBuffer = await pdfPromise;

    // Enviar correo
    console.log('Preparando envío de correo...');
    
    const info = await transporter.sendMail({
      from: `"Certificados" <${Deno.env.get("SMTP_USER")}>`,
      to: email,
      subject: `Tu certificado de ${certificateType} - ${programName}`,
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
    console.error('Error en generate-certificate:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error desconocido al generar el certificado'
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
