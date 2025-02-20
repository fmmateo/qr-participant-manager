
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, File, Calendar, Clock, Save, Check, X, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const CertificateTemplates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: templates, refetch } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleToggleActive = async (templateId: string, currentState: boolean) => {
    try {
      // Verificar si hay otros templates activos antes de desactivar el último
      if (currentState && templates) {
        const activeTemplates = templates.filter(t => t.is_active && t.id !== templateId);
        if (activeTemplates.length === 0) {
          toast({
            title: "Error",
            description: "Debe mantener al menos una plantilla activa",
            variant: "destructive",
          });
          return;
        }
      }

      const { error } = await supabase
        .from('certificate_templates')
        .update({ is_active: !currentState })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: `Plantilla ${!currentState ? 'activada' : 'desactivada'} correctamente`,
      });

      refetch();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al cambiar el estado de la plantilla",
        variant: "destructive",
      });
    }
  };

  const handleToggleLock = async (templateId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('certificate_templates')
        .update({ is_locked: !currentState })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: `Plantilla ${!currentState ? 'bloqueada' : 'desbloqueada'} correctamente`,
      });

      refetch();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al cambiar el estado de bloqueo de la plantilla",
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen primero",
        variant: "destructive",
      });
      return;
    }

    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la plantilla",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificate-templates')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificate-templates')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('certificate_templates')
        .insert([
          {
            name: templateName,
            template_url: publicUrl,
            is_active: true,
            is_locked: false
          }
        ]);

      if (dbError) throw dbError;

      toast({
        title: "¡Éxito!",
        description: "Plantilla guardada correctamente",
      });

      setTemplateName("");
      setSelectedFile(null);
      const fileInput = document.getElementById('template') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      refetch();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al guardar la plantilla",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-xl mx-auto space-y-8 animate-in">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Plantillas de Certificados</h1>
              <p className="text-muted-foreground">
                Sube y administra las plantillas para los certificados.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Nombre de la plantilla</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej: Plantilla Diplomado 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Imagen de la plantilla</Label>
                <div className="space-y-4">
                  <Input
                    id="template"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={isUploading || !selectedFile}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isUploading ? "Guardando..." : "Guardar Plantilla"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Historial de Plantillas</h2>
              <div className="grid gap-4">
                {templates?.map((template) => (
                  <div 
                    key={template.id} 
                    className={`flex flex-col space-y-3 p-4 border rounded-lg ${!template.is_active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-primary" />
                        <span className="font-medium">{template.name}</span>
                        {template.is_locked && (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Bloqueada
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {template.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                          <Switch
                            checked={template.is_active}
                            onCheckedChange={() => handleToggleActive(template.id, template.is_active)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleLock(template.id, template.is_locked)}
                        >
                          {template.is_locked ? 
                            <Unlock className="h-4 w-4" /> :
                            <Lock className="h-4 w-4" />
                          }
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(template.template_url, '_blank')}
                        >
                          Ver
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(template.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(template.created_at), "HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {templates?.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No hay plantillas subidas aún
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CertificateTemplates;
