
import { QrReader } from "react-qr-reader";

interface QrScannerProps {
  onScan: (result: string) => Promise<void>;
  isScanning: boolean;
  error?: string;
}

export const QrScanner = ({ onScan, isScanning, error }: QrScannerProps) => {
  const handleScan = (result: any) => {
    if (!isScanning || !result) return;
    onScan(result.text);
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg">
        <QrReader
          onResult={handleScan}
          constraints={{ 
            facingMode: 'environment',
            aspectRatio: 1
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
