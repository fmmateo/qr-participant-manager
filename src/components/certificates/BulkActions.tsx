
import { Button } from "@/components/ui/button";
import { SendHorizontal, FileCheck } from "lucide-react";

interface BulkActionsProps {
  isSendingBulk: boolean;
  isGeneratingFromAttendance: boolean;
  selectedProgramId: string;
  certificateType: string;
  selectedTemplateId: string;
  onBulkSend: () => Promise<void>;
  onGenerateFromAttendance: () => Promise<void>;
}

export const BulkActions = ({
  isSendingBulk,
  isGeneratingFromAttendance,
  selectedProgramId,
  certificateType,
  selectedTemplateId,
  onBulkSend,
  onGenerateFromAttendance,
}: BulkActionsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <Button 
        type="button"
        variant="secondary"
        className="w-full"
        disabled={isSendingBulk || !selectedProgramId || !certificateType || !selectedTemplateId}
        onClick={onBulkSend}
      >
        {isSendingBulk ? 'Procesando...' : 'Enviar a Todos los Participantes'}
        <SendHorizontal className="ml-2 h-4 w-4" />
      </Button>

      <Button 
        type="button"
        variant="outline"
        className="w-full"
        disabled={isGeneratingFromAttendance || !selectedProgramId || !certificateType || !selectedTemplateId}
        onClick={onGenerateFromAttendance}
      >
        {isGeneratingFromAttendance ? 'Generando...' : 'Generar por Asistencia'}
        <FileCheck className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};
