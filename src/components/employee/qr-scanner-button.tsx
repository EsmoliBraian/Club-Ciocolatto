"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
    };
  }
}

/**
 * Progressive enhancement over the manual code field: uses the native
 * BarcodeDetector API (Chrome/Edge/Android) when available. Degrades to
 * nothing (button hidden) on browsers without support — manual entry always
 * works regardless.
 */
export function QrScannerButton({ onDetected }: { onDetected: (value: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Feature detection must run post-mount: `window` isn't available during
    // SSR, so this can't be computed synchronously without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported("BarcodeDetector" in window);
  }, []);

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    const detector = new window.BarcodeDetector!({ formats: ["qr_code"] });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]) {
              onDetected(codes[0].rawValue);
              setScanning(false);
              return;
            }
          } catch {
            // transient decode errors are expected between frames
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      })
      .catch(() => setScanning(false));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [scanning, onDetected]);

  if (!supported) return null;

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setScanning(true)} className="w-full">
        <Camera className="size-4" />
        Escanear con cámara
      </Button>

      {scanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 p-6">
          <video ref={videoRef} className="aspect-square w-full max-w-xs rounded-2xl object-cover" muted playsInline />
          <p className="text-sm text-cc-cream-100">Apuntá al QR del cliente</p>
          <Button type="button" variant="outline" onClick={() => setScanning(false)}>
            <X className="size-4" />
            Cancelar
          </Button>
        </div>
      )}
    </>
  );
}
