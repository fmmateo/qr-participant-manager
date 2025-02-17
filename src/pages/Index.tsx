
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { UserPlus, QrCode, Award, Users2, LogIn, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold">Sistema de Gestión de Participantes</h1>
          <p className="text-xl text-muted-foreground">
            Gestiona participantes, asistencia y certificados
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link to="/participants">
            <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
              <UserPlus className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Registrar Participantes</h2>
              <p className="text-muted-foreground">
                Añade nuevos participantes al sistema
              </p>
            </Card>
          </Link>

          <Link to="/attendance">
            <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
              <QrCode className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Registrar Asistencia</h2>
              <p className="text-muted-foreground">
                Escanea códigos QR para registrar asistencia
              </p>
            </Card>
          </Link>

          <Link to="/certificates">
            <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
              <Award className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Emitir Certificados</h2>
              <p className="text-muted-foreground">
                Genera y envía certificados a los participantes
              </p>
            </Card>
          </Link>

          <Link to="/registration">
            <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
              <UserCheck className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Nueva Inscripción</h2>
              <p className="text-muted-foreground">
                Inscribe participantes en programas activos
              </p>
            </Card>
          </Link>
        </div>

        <div className="flex justify-center">
          <Link to="/auth">
            <Button variant="outline">
              <LogIn className="mr-2 h-4 w-4" />
              Acceso Administrativo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
