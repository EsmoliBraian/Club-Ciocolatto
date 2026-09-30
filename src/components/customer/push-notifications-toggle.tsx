"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { BellRinging, BellSlash } from "@phosphor-icons/react/dist/ssr";
import { subscribeToPushAction, unsubscribeFromPushAction } from "@/actions/customer-actions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const array = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) array[i] = rawData.charCodeAt(i);
  return array;
}

type Support = "checking" | "unsupported" | "supported";

export function PushNotificationsToggle() {
  const [support, setSupport] = useState<Support>("checking");
  const [enabled, setEnabled] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

    Promise.resolve()
      .then(() => {
        if (!isSupported) {
          setSupport("unsupported");
          return null;
        }
        setSupport("supported");
        return navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription());
      })
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        if (checked) {
          const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!publicKey) {
            toast.error("Las notificaciones push no están disponibles todavía.");
            return;
          }
          const permission = await Notification.requestPermission();
          if (permission !== "granted") {
            toast.error("Necesitás permitir notificaciones en el navegador.");
            return;
          }
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
          const json = subscription.toJSON();
          await subscribeToPushAction({
            endpoint: json.endpoint!,
            keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
          });
          setEnabled(true);
          toast.success("¡Listo! Vas a recibir notificaciones push.");
        } else {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await unsubscribeFromPushAction(subscription.endpoint);
            await subscription.unsubscribe();
          }
          setEnabled(false);
          toast.success("Notificaciones push desactivadas.");
        }
      } catch {
        toast.error("No pudimos activar las notificaciones push en este dispositivo.");
      }
    });
  }

  if (support !== "supported") return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
        {enabled ? <BellRinging size={20} weight="duotone" /> : <BellSlash size={20} weight="duotone" />}
      </span>
      <div className="min-w-0 flex-1">
        <Label htmlFor="push-toggle" className="font-medium text-foreground">
          Notificaciones push
        </Label>
        <p className="text-xs text-muted-foreground">Recibí avisos de puntos, ofertas y más en este dispositivo.</p>
      </div>
      <Switch id="push-toggle" checked={enabled} disabled={pending} onCheckedChange={handleToggle} />
    </div>
  );
}
