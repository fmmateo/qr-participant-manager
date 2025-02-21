
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  name: string;
  email: string;
  certificateNumber: string;
  certificateType: string;
  programType: string;
  programName: string;
  issueDate: string;
  templateId: string;
  templateUrl: string;
  htmlContent: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    console.log('Recibido payload:', payload);

    const emailResponse = await resend.emails.send({
      from: "Certificados <onboarding@resend.dev>",
      to: [payload.email],
      subject: `Tu certificado de ${payload.certificateType} - ${payload.programName}`,
      html: `
        <div style="
          font-family: Arial, sans-serif; 
          max-width: 900px; 
          margin: 0 auto; 
          padding: 20px;
          background-color: #FFFFFF;
        ">
          <h1 style="text-align: center; color: #333;">¡Felicitaciones ${payload.name}!</h1>
          <p style="text-align: center; font-size: 16px;">
            Has recibido un certificado de ${payload.certificateType} para el programa:
          </p>
          <h2 style="text-align: center; color: #444;">${payload.programName}</h2>
          
          <div style="
            margin: 30px auto;
            padding: 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
            background-color: #FFFFFF;
          ">
            ${payload.htmlContent}
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <p><strong>Número de certificado:</strong> ${payload.certificateNumber}</p>
            <p><strong>Fecha de emisión:</strong> ${payload.issueDate}</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            Este certificado ha sido generado automáticamente.
          </p>
        </div>
      `,
    });

    console.log('Respuesta de Resend:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: emailResponse.id,
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error en la función edge:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
};

serve(handler);
