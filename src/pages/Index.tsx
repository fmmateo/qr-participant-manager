
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { UserPlus, QrCode, Award, Users2, LogIn, UserCheck, BookOpen } from "lucide-react";
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

          <Link to="/programs">
            <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
              <BookOpen className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Gestionar Programas</h2>
              <p className="text-muted-foreground">
                Administra los programas disponibles
              </p>
            </Card>
          </Link>

          <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
            <Link to="/auth" className="flex flex-col items-center">
              <Users2 className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Acceso Administrativo</h2>
              <p className="text-muted-foreground text-center">
                Accede al panel de administración
              </p>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
