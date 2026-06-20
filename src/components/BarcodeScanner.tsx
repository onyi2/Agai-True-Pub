import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export function BarcodeScanner({ onScan, onClose }: { onScan: (result: string) => void, onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    
    const startScanning = async () => {
      try {
        const devices = await codeReader.listVideoInputDevices();
        if (devices.length > 0) {
            codeReader.decodeFromVideoDevice(devices[0].deviceId, videoRef.current!, (result, err) => {
                if (result) {
                    onScan(result.getText());
                }
            });
        }
      } catch (err) {
        console.error(err);
      }
    };

    startScanning();

    return () => {
      codeReader.reset();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#15181E] p-4 rounded-lg w-full max-w-sm">
        <video ref={videoRef} className="w-full rounded-lg" />
        <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-800 text-white rounded-lg">Close</button>
      </div>
    </div>
  );
}
