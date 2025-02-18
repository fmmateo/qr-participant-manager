
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Program } from "@/types/program";
import { Switch } from "@/components/ui/switch";

const ManagePrograms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    is_active: true
  });

  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Program[];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('programs')
        .insert([{
          name: formData.name,
          type: formData.type,
          is_active: formData.is_active
        }]);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: "Programa agregado correctamente",
      });

      setFormData({
        name: '',
        type: '',
        is_active: true
      });

      queryClient.invalidateQueries({ queryKey: ['programs'] });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al agregar el programa",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProgramStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('programs')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['programs'] });
      
      toast({
        title: "¡Éxito!",
        description: `Programa ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado del programa",
        variant: "destructive",
      });
    }
  };

  const deleteProgram = async (id: string) => {
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['programs'] });
      
      toast({
        title: "¡Éxito!",
        description: "Programa eliminado correctamente",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el programa",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-4xl mx-auto space-y-8">
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
              <h1 className="text-3xl font-bold">Gestionar Programas</h1>
              <p className="text-muted-foreground">
                Agrega y administra los programas disponibles para inscripción.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del programa</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Desarrollo Web Frontend"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de programa</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="curso">Curso</SelectItem>
                    <SelectItem value="taller">Taller</SelectItem>
                    <SelectItem value="diplomado">Diplomado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Programa activo</Label>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Agregando...' : 'Agregar Programa'}
                <Plus className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Programas Existentes</h2>
              {isLoading ? (
                <p>Cargando programas...</p>
              ) : (
                <div className="space-y-4">
                  {programs?.map((program) => (
                    <Card key={program.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{program.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Tipo: {program.type.charAt(0).toUpperCase() + program.type.slice(1)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={program.is_active}
                              onCheckedChange={() => toggleProgramStatus(program.id, program.is_active)}
                            />
                            <span className={program.is_active ? "text-green-600" : "text-red-600"}>
                              {program.is_active ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteProgram(program.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManagePrograms;

