
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    const { name, email, programName } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'Inscripciones <onboarding@resend.dev>',
      to: [email],
      subject: '¡Inscripción Confirmada!',
      html: `
        <h1>¡Gracias por tu inscripción, ${name}!</h1>
        <p>Tu inscripción al programa "${programName}" ha sido registrada exitosamente.</p>
        <p>Pronto recibirás más información sobre el inicio del programa.</p>
        <br>
        <p>Saludos cordiales,</p>
        <p>El equipo de formación</p>
      `,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    );
  }
});
