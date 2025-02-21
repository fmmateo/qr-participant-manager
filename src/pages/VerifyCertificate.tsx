
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Download } from "lucide-react";
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
          .maybeSingle();

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

  const handleDownload = async () => {
    if (certificateData?.image_url) {
      try {
        const response = await fetch(certificateData.image_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado-${certificateData.certificate_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error al descargar el certificado:', error);
        toast({
          title: "Error",
          description: "No se pudo descargar el certificado",
          variant: "destructive",
        });
      }
    }
  };

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
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Verificación de Certificado</h1>
            <div className="flex gap-2">
              {certificateData.image_url && (
                <Button onClick={handleDownload} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Certificado
                </Button>
              )}
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </div>
          </div>

          {certificateData.image_url && (
            <div className="mb-6 w-full">
              <img 
                src={certificateData.image_url} 
                alt="Certificado"
                className="w-full h-auto rounded-lg shadow-lg mb-6"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyCertificate;
