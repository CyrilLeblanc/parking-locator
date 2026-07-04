"use client";

import { Loader2, Locate, LocateFixed, LocateOff } from "lucide-react";
import { useGeolocation, type GeolocationMode } from "@/contexts/geolocation";

function Icon({ mode }: { mode: GeolocationMode }) {
  if (mode === "loading") return <Loader2 size={20} className="animate-spin text-white/70" />;
  if (mode === "following") return <LocateFixed size={20} className="text-blue-400" />;
  if (mode === "tracking") return <LocateFixed size={20} className="text-blue-300/50" />;
  if (mode === "error") return <LocateOff size={20} className="text-white/30" />;
  return <Locate size={20} className="text-white/70" />;
}

/**
 * Inner geolocation toggle button. Positioning-agnostic: its container styling is
 * provided through `className` so it can be composed into a shared control cluster
 * (see {@link MapControls}) alongside the zoom buttons.
 */
export function LocateButtonControl({ className }: { className: string }) {
  const { mode, toggle, isSupported } = useGeolocation();

  if (!isSupported) return null;

  return (
    <button type="button" onClick={toggle} aria-label="Me localiser" className={className}>
      <Icon mode={mode} />
    </button>
  );
}
