
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import puppeteer from "npm:puppeteer-core@21.5.2";
import * as Handlebars from "npm:handlebars@4.7.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const { 
      name, 
      email, 
      certificateNumber, 
      certificateType, 
      programType,
      programName,
      issueDate 
    }: CertificateEmailRequest = await req.json();

    // Conectar a Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Obtener la plantilla
    const { data: template, error: templateError } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("name", "Template Básico")
      .single();

    if (templateError) throw new Error("Error al obtener la plantilla");

    const getCertificateTypeText = (type: string) => {
      switch (type) {
        case "PARTICIPACION": return "Participación";
        case "APROBACION": return "Aprobación";
        case "ASISTENCIA": return "Asistencia";
        default: return type;
      }
    };

    const getProgramTypeText = (type: string) => {
      switch (type) {
        case "CURSO": return "Curso";
        case "TALLER": return "Taller";
        case "DIPLOMADO": return "Diplomado";
        default: return type;
      }
    };

    // Compilar la plantilla con Handlebars
    const compiledTemplate = Handlebars.compile(template.html_template);
    const html = compiledTemplate({
      participantName: name,
      certificateType: getCertificateTypeText(certificateType),
      programType: getProgramTypeText(programType).toLowerCase(),
      programName,
      certificateNumber,
      issueDate,
      borderColor: template.border_color,
      logoUrl: template.organization_logo_url,
    });

    // Generar PDF
    const browser = await puppeteer.launch({
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });
    await browser.close();

    // Enviar correo con el PDF adjunto
    const emailResponse = await resend.emails.send({
      from: "Certificados <onboarding@resend.dev>",
      to: [email],
      subject: `Tu certificado de ${getCertificateTypeText(certificateType)} - ${getProgramTypeText(programType)}`,
      html: `
        <h1>¡Hola ${name}!</h1>
        <p>Adjuntamos tu certificado de ${getCertificateTypeText(certificateType)} del ${getProgramTypeText(programType).toLowerCase()} "${programName}".</p>
        <p>Puedes encontrar tu certificado adjunto a este correo.</p>
        <p>Gracias por tu participación.</p>
      `,
      attachments: [
        {
          filename: `certificado-${certificateNumber}.pdf`,
          content: pdf,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
