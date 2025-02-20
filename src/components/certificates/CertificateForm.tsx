
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Program, Template } from "./types";
import { CertificateDesignSelect } from "./CertificateDesignSelect";

interface CertificateFormProps {
  email: string;
  setEmail: (email: string) => void;
  selectedProgramId: string;
  setSelectedProgramId: (id: string) => void;
  certificateType: string;
  setCertificateType: (type: string) => void;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  selectedDesignId: string;
  setSelectedDesignId: (id: string) => void;
  isSubmitting: boolean;
  programs?: Program[];
  templates?: Template[];
  isLoadingPrograms: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const CertificateForm = ({
  email,
  setEmail,
  selectedProgramId,
  setSelectedProgramId,
  certificateType,
  setCertificateType,
  selectedTemplateId,
  setSelectedTemplateId,
  selectedDesignId,
  setSelectedDesignId,
  isSubmitting,
  programs,
  templates,
  isLoadingPrograms,
  onSubmit,
}: CertificateFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico del participante</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="participante@ejemplo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="program">Programa</Label>
        <Select
          value={selectedProgramId}
          onValueChange={setSelectedProgramId}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un programa" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {isLoadingPrograms ? (
                <SelectItem value="loading" disabled>
                  Cargando programas...
                </SelectItem>
              ) : (
                programs?.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name} ({program.type})
                  </SelectItem>
                ))
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="certificateType">Tipo de certificado</Label>
        <Select
          value={certificateType}
          onValueChange={setCertificateType}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="PARTICIPACION">Participación</SelectItem>
              <SelectItem value="APROBACION">Aprobación</SelectItem>
              <SelectItem value="ASISTENCIA">Asistencia</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">Plantilla de certificado</Label>
        <Select
          value={selectedTemplateId}
          onValueChange={setSelectedTemplateId}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una plantilla" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {templates?.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <CertificateDesignSelect
        selectedDesignId={selectedDesignId}
        setSelectedDesignId={setSelectedDesignId}
      />

      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting || !selectedProgramId || !selectedTemplateId || !selectedDesignId}
      >
        {isSubmitting ? 'Procesando...' : 'Emitir y Enviar Certificado'}
        <Award className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
};
