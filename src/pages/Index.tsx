
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users2, QrCode, Award, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center">Sistema de Gestión de Asistencia</h1>
        <p className="text-muted-foreground text-center">
          Gestiona participantes, registra asistencia y genera certificados.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Button
              variant="ghost"
              className="w-full h-32 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate("/participants")}
            >
              <Users2 className="h-12 w-12" />
              <span className="text-lg font-medium">Administrar Participantes</span>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Button
              variant="ghost"
              className="w-full h-32 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate("/attendance")}
            >
              <UserCheck className="h-12 w-12" />
              <span className="text-lg font-medium">Registrar Asistencia</span>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Button
              variant="ghost"
              className="w-full h-32 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate("/manage-participants")}
            >
              <QrCode className="h-12 w-12" />
              <span className="text-lg font-medium">Gestionar QR</span>
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Button
              variant="ghost"
              className="w-full h-32 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate("/certificates")}
            >
              <Award className="h-12 w-12" />
              <span className="text-lg font-medium">Emitir Certificados</span>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
