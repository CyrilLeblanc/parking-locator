"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type GeolocationMode = "idle" | "loading" | "following" | "tracking" | "error";

interface GeolocationContextValue {
  mode: GeolocationMode;
  position: GeolocationCoordinates | null;
  isSupported: boolean;
  toggle: () => void;
  setMode: (mode: GeolocationMode) => void;
}

const GeolocationContext = createContext<GeolocationContextValue | null>(null);

export function GeolocationProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<GeolocationMode>("idle");
  const [position, setPosition] = useState<GeolocationCoordinates | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setMode("idle");
    setPosition(null);
  }, []);

  const startWatch = useCallback(() => {
    setMode("loading");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos.coords);
        setMode((prev) => (prev === "loading" || prev === "following" ? "following" : "tracking"));
      },
      (err) => {
        setMode("error");
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Accès à la localisation refusé");
        } else {
          toast.error("Impossible d'obtenir votre position");
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );
  }, []);

  const toggle = useCallback(() => {
    if (mode === "idle" || mode === "error") {
      startWatch();
    } else if (mode === "loading" || mode === "following") {
      stopWatch();
    } else if (mode === "tracking") {
      setMode("following");
    }
  }, [mode, startWatch, stopWatch]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <GeolocationContext.Provider value={{ mode, position, isSupported, toggle, setMode }}>
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocation() {
  const ctx = useContext(GeolocationContext);
  if (!ctx) throw new Error("useGeolocation must be used inside GeolocationProvider");
  return ctx;
}
