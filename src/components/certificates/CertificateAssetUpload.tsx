
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CertificateAssetUploadProps {
  onAssetUploaded: (assetUrl: string) => void;
  label: string;
  accept?: string;
}

export const CertificateAssetUpload = ({
  onAssetUploaded,
  label,
  accept = "image/*"
}: CertificateAssetUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Subir el archivo a Supabase Storage
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificate-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtener la URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('certificate-assets')
        .getPublicUrl(fileName);

      // Guardar referencia en la base de datos
      const { error: dbError } = await supabase
        .from('certificate_assets')
        .insert([
          {
            name: file.name,
            asset_url: publicUrl
          }
        ]);

      if (dbError) throw dbError;

      toast({
        title: "¡Éxito!",
        description: "Archivo subido correctamente",
      });

      onAssetUploaded(publicUrl);
    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      toast({
        title: "Error",
        description: error.message || "Error al subir el archivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`upload-${label}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={`upload-${label}`}
          type="file"
          accept={accept}
          onChange={handleUpload}
          disabled={isUploading}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        {isUploading && <Image className="animate-pulse h-5 w-5" />}
      </div>
    </div>
  );
};
