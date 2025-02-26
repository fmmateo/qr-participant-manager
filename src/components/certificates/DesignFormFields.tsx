
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
  speakerSignatureUrl: string;
  setSpeakerSignatureUrl: (url: string) => void;
  directorName: string;
  setDirectorName: (name: string) => void;
  speakerName: string;
  setSpeakerName: (name: string) => void;
}

export const DesignFormFields = ({
  name,
  setName,
  logoUrl,
  setLogoUrl,
  signatureUrl,
  setSignatureUrl,
  speakerSignatureUrl,
  setSpeakerSignatureUrl,
  directorName,
  setDirectorName,
  speakerName,
  setSpeakerName
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

      <div className="space-y-4">
        <div>
          <CertificateAssetUpload
            label="Firma digital del Director"
            onAssetUploaded={setSignatureUrl}
          />
          <div className="mt-2">
            <Label htmlFor="directorName">Nombre del Director</Label>
            <Input
              id="directorName"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              placeholder="Nombre del Director Académico"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <CertificateAssetUpload
            label="Firma digital del Expositor"
            onAssetUploaded={setSpeakerSignatureUrl}
          />
          <div className="mt-2">
            <Label htmlFor="speakerName">Nombre del Expositor</Label>
            <Input
              id="speakerName"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="Nombre del Expositor"
              className="mt-1"
            />
          </div>
        </div>
      </div>

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
          <Label>Vista previa de la firma del Director</Label>
          <img 
            src={signatureUrl} 
            alt="Director signature preview" 
            className="w-32 h-32 object-contain border rounded-lg"
          />
        </div>
      )}

      {speakerSignatureUrl && (
        <div className="space-y-2">
          <Label>Vista previa de la firma del Expositor</Label>
          <img 
            src={speakerSignatureUrl} 
            alt="Speaker signature preview" 
            className="w-32 h-32 object-contain border rounded-lg"
          />
        </div>
      )}
    </>
  );
};
