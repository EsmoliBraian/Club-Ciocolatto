"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Served from public/ (copied from node_modules/qr-scanner) so the worker
// loads reliably regardless of how the bundler resolves the library's own
// dynamic import — Next.js/Turbopack has had inconsistent luck with that.
QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

/**
 * Cross-browser camera QR scanner (works on Safari/iOS too, unlike the native
 * BarcodeDetector API this used to rely on). Degrades to nothing if the
 * device has no camera or the user denies permission — manual entry in the
 * parent form always works regardless.
 */
export function QrScannerButton({ onDetected }: { onDetected: (value: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        onDetected(result.data);
        setScanning(false);
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        onDecodeError: () => {
          // expected continuously while no code is in frame — not a real error
        },
      }
    );
    scannerRef.current = scanner;

    scanner.start().catch(() => {
      setError("No pudimos acceder a la cámara. Revisá los permisos del navegador.");
      setScanning(false);
    });

    return () => {
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [scanning, onDetected]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setError(null);
          setScanning(true);
        }}
        className="w-full"
      >
        <Camera className="size-4" />
        Escanear con cámara
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}

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
