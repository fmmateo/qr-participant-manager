
import { useState, useEffect } from "react";
import { QrReader } from "react-qr-reader";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface QrScannerProps {
  onScan: (result: string) => Promise<void>;
  isScanning: boolean;
  error?: string;
}

interface Device {
  deviceId: string;
  label: string;
}

export const QrScanner = ({ onScan, isScanning, error }: QrScannerProps) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Cámara ${device.deviceId.slice(0, 5)}`
          }));
        
        setDevices(videoDevices);
        
        // Seleccionar la primera cámara por defecto
        if (videoDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error al obtener dispositivos:', error);
      }
    };

    getDevices();
  }, []);

  const handleScan = (result: any) => {
    if (!isScanning || !result) return;
    onScan(result.text);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Seleccionar cámara</Label>
        <Select
          value={selectedDevice}
          onValueChange={setSelectedDevice}
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
