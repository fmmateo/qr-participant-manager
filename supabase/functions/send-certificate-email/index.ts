
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

    console.log("Received request with data:", {
      name,
      email,
      certificateNumber,
      certificateType,
      programType,
      programName,
      issueDate
    });

    // Conectar a Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Supabase client created");

    // Obtener la plantilla
    const { data: template, error: templateError } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("name", "Template Básico")
      .single();

    if (templateError) {
      console.error("Error fetching template:", templateError);
      throw new Error("Error al obtener la plantilla");
    }

    if (!template || !template.html_template) {
      console.error("Template or html_template is null:", template);
      throw new Error("Plantilla no encontrada o inválida");
    }

    console.log("Template found:", template.name);

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

    try {
      // Compilar la plantilla con Handlebars
      const compiledTemplate = Handlebars.compile(template.html_template);
      const html = compiledTemplate({
        participantName: name,
        certificateType: getCertificateTypeText(certificateType),
        programType: getProgramTypeText(programType).toLowerCase(),
        programName,
        certificateNumber,
        issueDate,
        borderColor: template.border_color || "#2D3748",
        logoUrl: template.organization_logo_url || "https://via.placeholder.com/200x100",
      });

      console.log("HTML template compiled successfully");

      // Generar PDF
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log("Browser launched");

      const page = await browser.newPage();
      await page.setContent(html, { 
        waitUntil: ["networkidle0", "domcontentloaded"] 
      });
      console.log("Page content set");

      const pdf = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" }
      });
      console.log("PDF generated successfully");

      await browser.close();
      console.log("Browser closed");

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
    } catch (innerError) {
      console.error("Error in PDF generation or email sending:", innerError);
      throw innerError;
    }
  } catch (error) {
    console.error("Error in handler:", error);
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
};

serve(handler);
