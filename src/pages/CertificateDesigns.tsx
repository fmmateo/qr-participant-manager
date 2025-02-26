
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CertificateDesignEditor } from "@/components/certificates/CertificateDesignEditor";
import type { CertificateDesign } from "@/components/certificates/types";

const CertificateDesigns = () => {
  const navigate = useNavigate();
  const [selectedDesign, setSelectedDesign] = useState<CertificateDesign | undefined>();

  const { data: designs, refetch } = useQuery({
    queryKey: ['certificate-designs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_designs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as CertificateDesign[];
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/certificates')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Certificados
        </Button>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Diseños de Certificados</h1>
          <p className="text-muted-foreground">
            Gestiona los diseños de tus certificados, incluyendo logos y firmas.
          </p>

          <CertificateDesignEditor
            design={selectedDesign}
            onSave={() => {
              refetch();
              setSelectedDesign(undefined);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CertificateDesigns;
