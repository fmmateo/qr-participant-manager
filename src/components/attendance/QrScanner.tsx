
import { useState, useEffect } from "react";
import { QrReader } from "react-qr-reader";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { Device, ConnectedDevice } from "./types";

interface QrScannerProps {
  onScan: (result: string) => Promise<void>;
  isScanning: boolean;
  error?: string;
}

export const QrScanner = ({ onScan, isScanning, error }: QrScannerProps) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const { toast } = useToast();

  // Obtener dispositivos locales
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Cámara ${device.deviceId.slice(0, 5)}`,
            isActive: true
          }));
        
        setDevices(videoDevices);
        
        // Si no hay dispositivo seleccionado y hay dispositivos disponibles
        if (videoDevices.length > 0 && !selectedDevice) {
          // Intentar seleccionar una cámara trasera primero
          const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('trasera')
          );
          
          const deviceToUse = backCamera || videoDevices[0];
          setSelectedDevice(deviceToUse.deviceId);
          registerDevice(deviceToUse);
        }
      } catch (error) {
        console.error('Error al obtener dispositivos:', error);
        toast({
          title: "Error al acceder a la cámara",
          description: "Por favor, asegúrate de dar permiso para usar la cámara.",
          variant: "destructive"
        });
      }
    };

    getDevices();
  }, []);

  // Registrar dispositivo en la base de datos
  const registerDevice = async (device: Device) => {
    try {
      const deviceData = {
        device_id: device.deviceId,
        device_label: device.label,
        last_seen: new Date().toISOString(),
        is_active: true
      };

      const { error } = await supabase
        .from('connected_devices')
        .upsert(deviceData, {
          onConflict: 'device_id'
        });

      if (error) throw error;
      
      toast({
        title: "Dispositivo conectado",
        description: `${device.label} está listo para escanear`,
      });

      // Actualizar la lista de dispositivos conectados
      updateConnectedDevices();
    } catch (error) {
      console.error('Error al registrar dispositivo:', error);
      toast({
        title: "Error al conectar dispositivo",
        description: "No se pudo registrar el dispositivo en el sistema.",
        variant: "destructive"
      });
    }
  };

  // Suscribirse a cambios en dispositivos conectados
  useEffect(() => {
    if (!selectedDevice) return;

    const channel = supabase
      .channel('connected-devices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connected_devices'
        },
        () => {
          updateConnectedDevices();
        }
      )
      .subscribe();

    // Actualizar estado de conexión cada minuto
    const interval = setInterval(() => {
      if (selectedDevice) {
        updateDeviceStatus();
      }
    }, 60000);

    // Cargar dispositivos conectados inicialmente
    updateConnectedDevices();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [selectedDevice]);

  // Actualizar estado del dispositivo
  const updateDeviceStatus = async () => {
    if (!selectedDevice) return;

    try {
      const { error } = await supabase
        .from('connected_devices')
        .update({ 
          last_seen: new Date().toISOString(),
          is_active: true
        })
        .eq('device_id', selectedDevice);

      if (error) throw error;
    } catch (error) {
      console.error('Error al actualizar estado del dispositivo:', error);
    }
  };

  // Obtener lista de dispositivos conectados
  const updateConnectedDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('connected_devices')
        .select('*')
        .eq('is_active', true) as { data: ConnectedDevice[] | null, error: any };

      if (error) throw error;

      if (data) {
        setConnectedDevices(data.map(d => ({
          deviceId: d.device_id,
          label: d.device_label,
          isActive: d.is_active
        })));
      }
    } catch (error) {
      console.error('Error al obtener dispositivos conectados:', error);
    }
  };

  const handleScan = (result: any) => {
    if (!isScanning || !result) return;
    onScan(result.text);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Seleccionar cámara</Label>
        <Select
          value={selectedDevice}
          onValueChange={(deviceId) => {
            setSelectedDevice(deviceId);
            const device = devices.find(d => d.deviceId === deviceId);
            if (device) registerDevice(device);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una cámara" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Dispositivos conectados</Label>
        <div className="flex flex-wrap gap-2">
          {connectedDevices.map((device) => (
            <Badge key={device.deviceId} variant={device.deviceId === selectedDevice ? "default" : "secondary"}>
              {device.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg">
        <QrReader
          onResult={handleScan}
          constraints={{ 
            facingMode: 'environment',
            aspectRatio: 1,
            deviceId: selectedDevice
          }}
          className="w-full h-full"
          videoId="qr-video"
        />
      </div>
      
      {error && (
        <p className="text-destructive text-sm text-center">{error}</p>
      )}
    </div>
  );
};
