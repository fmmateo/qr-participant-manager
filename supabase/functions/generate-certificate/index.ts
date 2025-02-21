
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SIMPLECERT_API_KEY = Deno.env.get('SIMPLECERT_API_KEY');
const SMTP_HOST = Deno.env.get('SMTP_HOST');
const SMTP_PORT = Deno.env.get('SMTP_PORT');
const SMTP_USER = Deno.env.get('SMTP_USER');
const SMTP_PASS = Deno.env.get('SMTP_PASS');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando generación de certificado...');
    
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
      programType,
      programName,
      designParams: design?.design_params
    });

    // Validar datos requeridos
    if (!email || !name || !certificateNumber || !programName) {
      throw new Error('Faltan datos requeridos para generar el certificado');
    }

    // Configurar cliente SMTP
    const emailData = {
      to: email,
      subject: `Tu certificado de ${certificateType} - ${programName}`,
      text: `¡Felicitaciones ${name}! Has completado exitosamente el programa ${programName}.`,
      html: `
        <h1>¡Felicitaciones ${name}!</h1>
        <p>Has completado exitosamente el programa ${programName}.</p>
        <p>Tu código de verificación es: ${certificateNumber}</p>
      `
    };

    // Enviar correo usando la API de Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Certificados <certificados@resend.dev>',
        to: [email],
        subject: emailData.subject,
        html: emailData.html
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Error al enviar email:', errorData);
      throw new Error(`Error al enviar email: ${errorData.message || 'Error desconocido'}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email enviado exitosamente:', emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        id: emailResult.id,
        verificationUrl: `https://certificados.example.com/verify/${certificateNumber}`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
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
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});
