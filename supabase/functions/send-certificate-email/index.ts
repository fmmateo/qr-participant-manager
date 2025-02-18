
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

    const apiFlashKey = Deno.env.get("APIFLASH_ACCESS_KEY");
    
    if (!apiFlashKey) {
      throw new Error("APIFlash access key no está configurada");
    }

    const certificateHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 40px; background: linear-gradient(135deg, #004d1a 0%, #006622 100%); font-family: Arial, sans-serif; color: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .certificate { border: 4px solid #FFD700; padding: 40px; max-width: 800px; margin: 0 auto; background-color: rgba(0, 77, 26, 0.9); }
    .title { color: #FFD700; font-size: 32px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
    .subtitle { color: #FFD700; font-size: 24px; margin-bottom: 40px; letter-spacing: 1px; }
    .name { color: #FFD700; font-size: 48px; margin: 30px 0; text-transform: uppercase; letter-spacing: 3px; }
    .details { margin: 20px 0; font-size: 18px; line-height: 1.5; }
    .program { color: #FFD700; font-size: 28px; margin: 20px 0; font-style: italic; }
    .footer { font-size: 16px; margin-top: 40px; color: #FFD700; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="title">CONSEJO NACIONAL DE COOPERATIVAS</div>
    <div class="subtitle">CONAPCOOP</div>
    <div class="details">Otorga el presente certificado de ${certificateTypeText} a:</div>
    <div class="name">${name}</div>
    <div class="details">Por su ${certificateTypeText.toLowerCase()} en el ${programType.toLowerCase()}:</div>
    <div class="program">"${programName}"</div>
    <div class="footer">
      Certificado N°: ${certificateNumber}<br>
      Fecha de emisión: ${issueDate}
    </div>
  </div>
</body>
</html>`;

    // Crear una URL temporal para el HTML usando paste.ee
    console.log("Creando URL temporal para el HTML...");
    const pasteResponse = await fetch("https://api.paste.ee/v1/pastes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": "2hRBg1BSMGXxhJzvTFMWVfqXGiJ3t94jDcGROqw4I"
      },
      body: JSON.stringify({
        description: "Certificate HTML",
        sections: [
          {
            name: "certificate.html",
            syntax: "html",
            contents: certificateHtml
          }
        ]
      })
    });

    if (!pasteResponse.ok) {
      throw new Error("Error al crear URL temporal para el HTML");
    }

    const pasteData = await pasteResponse.json();
    const htmlUrl = `https://paste.ee/r/${pasteData.id}`;
    console.log("URL temporal creada:", htmlUrl);

    // Construir la URL de APIFlash
    const apiFlashUrl = new URL('https://api.apiflash.com/v1/urltoimage');
    apiFlashUrl.searchParams.set('access_key', apiFlashKey);
    apiFlashUrl.searchParams.set('url', htmlUrl);
    apiFlashUrl.searchParams.set('format', 'png');
    apiFlashUrl.searchParams.set('width', '1000');
    apiFlashUrl.searchParams.set('height', '1414');
    apiFlashUrl.searchParams.set('quality', '100');
    apiFlashUrl.searchParams.set('full_page', 'true');
    apiFlashUrl.searchParams.set('fresh', 'true');

    console.log("Generando imagen del certificado con APIFlash...");
    
    // Obtener la imagen del certificado
    const certificateResponse = await fetch(apiFlashUrl.toString());
    if (!certificateResponse.ok) {
      const errorText = await certificateResponse.text();
      throw new Error(`Error al generar el certificado: ${certificateResponse.statusText}. Detalles: ${errorText}`);
    }

    const certificateBuffer = await certificateResponse.arrayBuffer();
    console.log("Imagen del certificado generada exitosamente");

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
          filename: `certificado-${certificateNumber}.png`,
          content: certificateBuffer
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
