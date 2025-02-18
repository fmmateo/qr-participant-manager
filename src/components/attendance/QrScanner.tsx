import { useState, useEffect, useCallback } from "react";
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
  const [usbBuffer, setUsbBuffer] = useState<string>('');
  const { toast } = useToast();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Registrar dispositivo móvil
  const registerMobileDevice = useCallback(async () => {
    if (!isMobile) return;
    
    console.log('Registrando dispositivo móvil...');
    const mobileDeviceId = 'mobile-' + navigator.userAgent;
    const mobileDevice: Device = {
      deviceId: mobileDeviceId,
      label: 'Dispositivo Móvil',
      type: 'mobile'
    };
    
    try {
      await registerDevice(mobileDevice);
      // Seleccionar automáticamente el dispositivo móvil
      setSelectedDevice(mobileDeviceId);
    } catch (error) {
      console.error('Error al registrar dispositivo móvil:', error);
    }
  }, [isMobile]);

  // Registrar dispositivo en la base de datos
  const registerDevice = async (device: Device) => {
    console.log('Intentando registrar dispositivo:', device);
    try {
      const deviceData = {
        device_id: device.deviceId,
        device_label: device.label,
        device_type: device.type,
        last_seen: new Date().toISOString(),
        is_active: true
      };

      // Primero intentamos actualizar si existe
      const { error: updateError } = await supabase
        .from('connected_devices')
        .upsert(deviceData, {
          onConflict: 'device_id'
        });

      if (updateError) throw updateError;
      
      console.log('Dispositivo registrado exitosamente:', device.label);
      toast({
        title: "Dispositivo conectado",
        description: `${device.label} está listo para escanear`,
      });

      // Actualizar la lista de dispositivos conectados
      await updateConnectedDevices();
    } catch (error) {
      console.error('Error al registrar dispositivo:', error);
      toast({
        title: "Error al conectar dispositivo",
        description: "No se pudo registrar el dispositivo en el sistema.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Efecto para registro inicial de dispositivo móvil
  useEffect(() => {
    console.log('Iniciando registro de dispositivo móvil...');
    registerMobileDevice();
  }, [registerMobileDevice]);

  // Obtener dispositivos locales
  useEffect(() => {
    const getDevices = async () => {
      // Si es un dispositivo móvil, no necesitamos buscar cámaras adicionales
      if (isMobile) {
        console.log('Dispositivo móvil detectado, omitiendo búsqueda de cámaras');
        return;
      }

      try {
        console.log('Buscando dispositivos de video...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Cámara ${device.deviceId.slice(0, 5)}`,
            type: 'camera' as const,
            isActive: true
          }));
        
        console.log('Dispositivos de video encontrados:', videoDevices);
        setDevices(videoDevices);
        
        if (videoDevices.length > 0 && !selectedDevice) {
          const backCamera = videoDevices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('trasera')
          );
          
          const deviceToUse = backCamera || videoDevices[0];
          console.log('Seleccionando cámara:', deviceToUse.label);
          setSelectedDevice(deviceToUse.deviceId);
          await registerDevice(deviceToUse);
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
  }, [isMobile]);

  // Actualizar estado del dispositivo periódicamente
  useEffect(() => {
    const updateStatus = async () => {
      const activeDeviceIds = [
        selectedDevice,
        isMobile ? 'mobile-' + navigator.userAgent : null,
        'usb-scanner'
      ].filter(Boolean);

      try {
        const { error } = await supabase
          .from('connected_devices')
          .update({ 
            last_seen: new Date().toISOString(),
            is_active: true
          })
          .in('device_id', activeDeviceIds);

        if (error) throw error;
      } catch (error) {
        console.error('Error al actualizar estado de dispositivos:', error);
      }
    };

    // Actualizar inmediatamente y luego cada minuto
    updateStatus();
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, [selectedDevice, isMobile]);

  // Suscribirse a cambios en dispositivos conectados
  useEffect(() => {
    console.log('Configurando suscripción a cambios en dispositivos...');
    const channel = supabase
      .channel('connected-devices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connected_devices'
        },
        (payload) => {
          console.log('Cambio detectado en dispositivos:', payload);
          updateConnectedDevices();
        }
      )
      .subscribe();

    // Cargar dispositivos conectados inicialmente
    updateConnectedDevices();

    return () => {
      console.log('Limpiando suscripción a cambios en dispositivos');
      supabase.removeChannel(channel);
    };
  }, []);

  // Obtener lista de dispositivos conectados
  const updateConnectedDevices = async () => {
    try {
      console.log('Actualizando lista de dispositivos conectados...');
      const { data, error } = await supabase
        .from('connected_devices')
        .select('*')
        .eq('is_active', true) as { data: ConnectedDevice[] | null, error: any };

      if (error) throw error;

      if (data) {
        console.log('Dispositivos conectados:', data);
        const devices = data.map(d => ({
          deviceId: d.device_id,
          label: d.device_label,
          type: d.device_type as 'camera' | 'usb' | 'mobile',
          isActive: d.is_active
        }));
        setConnectedDevices(devices);

        // Si el dispositivo seleccionado no está en la lista, intentar seleccionar otro
        if (selectedDevice && !devices.find(d => d.deviceId === selectedDevice)) {
          const firstDevice = devices[0];
          if (firstDevice) {
            console.log('Cambiando a dispositivo disponible:', firstDevice.label);
            setSelectedDevice(firstDevice.deviceId);
          }
        }
      }
    } catch (error) {
      console.error('Error al obtener dispositivos conectados:', error);
    }
  };

  // Manejar entrada del lector USB
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isScanning) return;

    // Si es Enter, procesar el código escaneado
    if (event.key === 'Enter') {
      if (usbBuffer) {
        // Registrar el lector USB como dispositivo conectado
        const usbDevice: Device = {
          deviceId: 'usb-scanner',
          label: 'Lector USB',
          type: 'usb'
        };
        registerDevice(usbDevice);
        
        onScan(usbBuffer);
        setUsbBuffer('');
      }
      return;
    }

    // Acumular caracteres en el buffer
    setUsbBuffer(prev => prev + event.key);

    // Limpiar el buffer después de un tiempo de inactividad
    setTimeout(() => {
      setUsbBuffer('');
    }, 100);
  }, [isScanning, usbBuffer, onScan]);

  // Configurar el listener para el lector USB
  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [handleKeyPress]);

  const handleScan = (result: any) => {
    if (!isScanning || !result) return;
    onScan(result.text);
  };

  return (
    <div className="space-y-6">
      {!isMobile && (
        <div className="space-y-2">
          <Label>Seleccionar cámara</Label>
          <Select
            value={selectedDevice}
            onValueChange={async (deviceId) => {
              setSelectedDevice(deviceId);
              const device = devices.find(d => d.deviceId === deviceId);
              if (device) {
                try {
                  await registerDevice(device);
                } catch (error) {
                  console.error('Error al cambiar dispositivo:', error);
                }
              }
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
      )}

      <div className="space-y-2">
        <Label>Dispositivos conectados</Label>
        <div className="flex flex-wrap gap-2">
          {connectedDevices.map((device) => (
            <Badge 
              key={device.deviceId} 
              variant={device.deviceId === selectedDevice ? "default" : "secondary"}
            >
              {device.label} ({device.type})
            </Badge>
          ))}
        </div>
      </div>

      {!isMobile && (
        <div className="space-y-2">
          <Label>Escáner USB</Label>
          <p className="text-sm text-muted-foreground">
            Conecta un lector de códigos USB para escanear automáticamente
          </p>
        </div>
      )}

      <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg">
        <QrReader
          onResult={handleScan}
          constraints={{ 
            facingMode: 'environment',
            aspectRatio: 1,
            deviceId: isMobile ? undefined : selectedDevice
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
