"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability degrades gracefully — the app still works without an SW.
    });

    // Without this, a device can get stuck showing an old cached build
    // indefinitely: a new SW installs in the background, but the page
    // already open (or reopened from a stale home-screen icon) keeps
    // running under the OLD SW's control until a full reload happens to
    // pick up the new one. Reloading once, automatically, the moment
    // control switches over closes that gap.
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }, []);

  return null;
}
