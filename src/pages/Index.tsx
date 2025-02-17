
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
          <Link to="/registration">
            <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
              <UserPlus className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Nueva Inscripción</h2>
              <p className="text-muted-foreground">
                Regístrate en nuestros programas
              </p>
            </Card>
          </Link>

          <Link to="/auth">
            <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
              <Users2 className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Acceso Administrativo</h2>
              <p className="text-muted-foreground text-center">
                Accede al panel de administración
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
