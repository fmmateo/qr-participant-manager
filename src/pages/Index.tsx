
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { UserPlus, Users, QrCode, Award, UserCheck } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Sistema de Gestión</h1>
          <p className="text-xl text-muted-foreground">
            Administra participantes, asistencias y certificados.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Button 
              variant="ghost" 
              className="w-full h-32 flex flex-col gap-4"
              onClick={() => navigate('/participants')}
            >
              <UserPlus className="h-12 w-12" />
              <span>Gestionar Participantes</span>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Button 
              variant="ghost" 
              className="w-full h-32 flex flex-col gap-4"
              onClick={() => navigate('/participants/list')}
            >
              <Users className="h-12 w-12" />
              <span>Lista de Participantes</span>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Button 
              variant="ghost" 
              className="w-full h-32 flex flex-col gap-4"
              onClick={() => navigate('/attendance')}
            >
              <QrCode className="h-12 w-12" />
              <span>Registrar Asistencia</span>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Button 
              variant="ghost" 
              className="w-full h-32 flex flex-col gap-4"
              onClick={() => navigate('/certificates')}
            >
              <Award className="h-12 w-12" />
              <span>Emitir Certificados</span>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Button 
              variant="ghost" 
              className="w-full h-32 flex flex-col gap-4 bg-primary/5 hover:bg-primary/10"
              onClick={() => navigate('/registration')}
            >
              <UserCheck className="h-12 w-12" />
              <span>Nueva Inscripción</span>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
