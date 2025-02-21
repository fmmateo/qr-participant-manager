
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VerifyCertificate = () => {
  const { certificateNumber } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certificateData, setCertificateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select(`
            *,
            participants (
              name,
              email
            )
          `)
          .eq('certificate_number', certificateNumber)
          .single();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Error",
            description: "Certificado no encontrado",
            variant: "destructive",
          });
          return;
        }

        setCertificateData(data);
      } catch (error) {
        console.error('Error al obtener certificado:', error);
        toast({
          title: "Error",
          description: "Error al verificar el certificado",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (certificateNumber) {
      fetchCertificate();
    }
  }, [certificateNumber, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6 flex items-center justify-center">
        <p className="text-lg">Cargando certificado...</p>
      </div>
    );
  }

  if (!certificateData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
        <div className="max-w-xl mx-auto">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Certificado no encontrado</h1>
            <p className="mb-4">El certificado que intentas verificar no existe o no es válido.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-xl mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Verificación de Certificado</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">Número de Certificado:</h2>
              <p className="text-muted-foreground">{certificateData.certificate_number}</p>
            </div>

            <div>
              <h2 className="font-semibold">Participante:</h2>
              <p className="text-muted-foreground">{certificateData.participants?.name}</p>
            </div>

            <div>
              <h2 className="font-semibold">Programa:</h2>
              <p className="text-muted-foreground">{certificateData.program_name}</p>
            </div>

            <div>
              <h2 className="font-semibold">Tipo de Certificado:</h2>
              <p className="text-muted-foreground">{certificateData.certificate_type}</p>
            </div>

            <div>
              <h2 className="font-semibold">Fecha de Emisión:</h2>
              <p className="text-muted-foreground">
                {new Date(certificateData.issue_date).toLocaleDateString('es-ES')}
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyCertificate;
