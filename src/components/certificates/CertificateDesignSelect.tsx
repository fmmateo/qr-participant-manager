
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CertificateDesign } from "./types";

interface CertificateDesignSelectProps {
  selectedDesignId: string;
  setSelectedDesignId: (id: string) => void;
}

export const CertificateDesignSelect = ({
  selectedDesignId,
  setSelectedDesignId,
}: CertificateDesignSelectProps) => {
  const { data: designs, isLoading } = useQuery({
    queryKey: ['certificate-designs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_designs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CertificateDesign[];
    }
  });

  return (
    <div className="space-y-2">
      <Label htmlFor="design">Diseño del certificado</Label>
      <Select
        value={selectedDesignId}
        onValueChange={setSelectedDesignId}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un diseño" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {isLoading ? (
              <SelectItem value="loading" disabled>
                Cargando diseños...
              </SelectItem>
            ) : (
              designs?.map((design) => (
                <SelectItem key={design.id} value={design.id}>
                  {design.name}
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
