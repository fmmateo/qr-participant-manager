
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users2 } from "lucide-react";

const ManageParticipants = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-6">Gestión de Participantes</h1>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              className="h-32"
              variant="outline"
              onClick={() => navigate("/registration")}
            >
              <div className="flex flex-col items-center">
                <Users2 className="h-12 w-12 mb-2" />
                <span>Registrar Nuevo Participante</span>
              </div>
            </Button>
            
            <Button
              className="h-32"
              variant="outline"
              onClick={() => navigate("/participant-list")}
            >
              <div className="flex flex-col items-center">
                <Users2 className="h-12 w-12 mb-2" />
                <span>Ver Lista de Participantes</span>
              </div>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManageParticipants;
