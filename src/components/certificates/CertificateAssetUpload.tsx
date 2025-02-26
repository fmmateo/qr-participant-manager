
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
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

      // Validar tamaño del archivo (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. Máximo 5MB permitido.');
      }

      // Crear un nombre de archivo único y seguro
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

      // Subir el archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificate-assets')
        .upload(`assets/${fileName}`, file);

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError);
        throw new Error('Error al subir el archivo. Por favor, inténtalo de nuevo.');
      }

      // Obtener la URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('certificate-assets')
        .getPublicUrl(`assets/${fileName}`);

      // Guardar referencia en la base de datos
      const { error: dbError } = await supabase
        .from('certificate_assets')
        .insert([
          {
            name: file.name,
            asset_url: publicUrl,
            file_path: `assets/${fileName}`,
            type: 'image',
            size: file.size,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }
        ]);

      if (dbError) {
        console.error('Error al guardar en BD:', dbError);
        // No lanzamos error aquí, solo lo registramos
        toast({
          title: "Advertencia",
          description: "El archivo se subió pero hubo un error al registrarlo. Puedes continuar usando el archivo.",
          variant: "default",
        });
      }

      toast({
        title: "¡Éxito!",
        description: "Archivo subido correctamente",
      });

      onAssetUploaded(publicUrl);
    } catch (error: any) {
      console.error('Error en el proceso de carga:', error);
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
        {isUploading && <Loader2 className="animate-spin h-5 w-5" />}
      </div>
    </div>
  );
};
