
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CertificateDesign } from "./types";
import { DesignFormFields } from "./DesignFormFields";
import { getCertificateTemplate } from "./certificateTemplate";

interface CertificateDesignEditorProps {
  design?: CertificateDesign;
  onSave?: () => void;
}

export const CertificateDesignEditor = ({ 
  design,
  onSave 
}: CertificateDesignEditorProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(design?.name || "");
  const [logoUrl, setLogoUrl] = useState(design?.design_params?.logo_url?.url || "");
  const [signatureUrl, setSignatureUrl] = useState(design?.design_params?.signature_url?.url || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const designParams = {
        title: { text: "Certificado de Participación", type: "text" },
        logo_url: { url: logoUrl, type: "image" },
        signature_url: { url: signatureUrl, type: "image" },
        template_html: { text: getCertificateTemplate(), type: "html" }
      };

      if (design?.id) {
        const { error } = await supabase
          .from('certificate_designs')
          .update({
            name,
            design_params: designParams,
            updated_at: new Date().toISOString()
          })
          .eq('id', design.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('certificate_designs')
          .insert([{
            name,
            format: 'html',
            design_params: designParams,
            metadata: { version: 1, type: 'professional_certificate' }
          }]);

        if (error) throw error;
      }

      toast({
        title: "¡Éxito!",
        description: "Diseño guardado correctamente",
      });

      if (onSave) onSave();
    } catch (error: any) {
      console.error('Error al guardar diseño:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el diseño",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <DesignFormFields
          name={name}
          setName={setName}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          signatureUrl={signatureUrl}
          setSignatureUrl={setSignatureUrl}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting || !name || !logoUrl || !signatureUrl}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Guardando..." : "Guardar Diseño"}
        </Button>
      </form>
    </Card>
  );
};
