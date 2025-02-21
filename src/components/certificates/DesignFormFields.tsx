
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CertificateAssetUpload } from "./CertificateAssetUpload";

interface DesignFormFieldsProps {
  name: string;
  setName: (name: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  signatureUrl: string;
  setSignatureUrl: (url: string) => void;
}

export const DesignFormFields = ({
  name,
  setName,
  logoUrl,
  setLogoUrl,
  signatureUrl,
  setSignatureUrl
}: DesignFormFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del diseño</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Certificado Profesional 2024"
          required
        />
      </div>

      <CertificateAssetUpload
        label="Logo de la empresa"
        onAssetUploaded={setLogoUrl}
      />

      <CertificateAssetUpload
        label="Firma digital"
        onAssetUploaded={setSignatureUrl}
      />

      {logoUrl && (
        <div className="space-y-2">
          <Label>Vista previa del logo</Label>
          <img 
            src={logoUrl} 
            alt="Logo preview" 
            className="w-32 h-32 object-contain border rounded-lg"
          />
        </div>
      )}

      {signatureUrl && (
        <div className="space-y-2">
          <Label>Vista previa de la firma</Label>
          <img 
            src={signatureUrl} 
            alt="Signature preview" 
            className="w-32 h-32 object-contain border rounded-lg"
          />
        </div>
      )}
    </>
  );
};
