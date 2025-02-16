
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusCircle, Users, QrCode, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-in">
        <header className="text-center space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Panel de Control
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Gestión de Participantes
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Administra tus talleres y diplomados con facilidad. Genera códigos QR, controla asistencia y emite certificados automáticamente.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 glass-card hover:scale-105 transition-transform duration-200">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Gestionar Participantes</h2>
              <p className="text-muted-foreground">
                Importa tu lista de estudiantes y genera códigos QR automáticamente.
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate('/participants')}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Grupo
              </Button>
            </div>
          </Card>

          <Card className="p-6 glass-card hover:scale-105 transition-transform duration-200">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Control de Asistencia</h2>
              <p className="text-muted-foreground">
                Escanea códigos QR y registra la asistencia en tiempo real.
              </p>
              <Button variant="secondary" className="w-full">
                Escanear QR
              </Button>
            </div>
          </Card>

          <Card className="p-6 glass-card hover:scale-105 transition-transform duration-200">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Certificados</h2>
              <p className="text-muted-foreground">
                Genera y envía certificados personalizados automáticamente.
              </p>
              <Button variant="outline" className="w-full">
                Gestionar Certificados
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
