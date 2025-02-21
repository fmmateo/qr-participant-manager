
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Download, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';

const VerifyCertificate = () => {
  const { certificateNumber } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certificateData, setCertificateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef<HTMLDivElement>(null);

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

  const handleImageCapture = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: null
      });

      // Convertir a blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob as Blob);
        }, 'image/png', 1.0);
      });

      // Subir a Supabase Storage
      const fileName = `certificates/${certificateData.certificate_number}_${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: publicUrl } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName);

      // Actualizar el registro del certificado
      const { error: updateError } = await supabase
        .from('certificates')
        .update({
          image_url: publicUrl.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('certificate_number', certificateData.certificate_number);

      if (updateError) throw updateError;

      toast({
        title: "¡Éxito!",
        description: "Certificado capturado y guardado correctamente",
      });

      // Actualizar datos locales
      setCertificateData({
        ...certificateData,
        image_url: publicUrl.publicUrl
      });

    } catch (error) {
      console.error('Error al capturar certificado:', error);
      toast({
        title: "Error",
        description: "No se pudo capturar el certificado",
        variant: "destructive",
      });
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
              <Button onClick={handleImageCapture} variant="outline">
                <Camera className="mr-2 h-4 w-4" />
                Capturar Certificado
              </Button>
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

          <div ref={certificateRef} className="certificate-container bg-white p-8 rounded-lg shadow-lg mb-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary mb-2">Certificado de {certificateData.certificate_type}</h2>
              <p className="text-xl">Se certifica que:</p>
              <h3 className="text-2xl font-bold mt-4 mb-2">{certificateData.participants?.name}</h3>
              <p className="text-lg">
                Ha completado satisfactoriamente el programa:
              </p>
              <h4 className="text-xl font-semibold mt-2 mb-4">{certificateData.program_name}</h4>
              <p className="text-md mt-4">
                Fecha de emisión: {new Date(certificateData.issue_date).toLocaleDateString('es-ES')}
              </p>
              <p className="text-sm mt-2 text-muted-foreground">
                Número de certificado: {certificateData.certificate_number}
              </p>
            </div>
          </div>
          
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
