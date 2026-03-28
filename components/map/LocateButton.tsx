"use client";

import { Loader2, Locate, LocateFixed, LocateOff } from "lucide-react";
import { useGeolocation, type GeolocationMode } from "@/contexts/geolocation";
import { useMapSelection } from "@/contexts/map-selection";
import { useIsMobile } from "@/hooks/use-is-mobile";

function Icon({ mode }: { mode: GeolocationMode }) {
  if (mode === "loading") return <Loader2 size={20} className="animate-spin text-white/70" />;
  if (mode === "following") return <LocateFixed size={20} className="text-blue-400" />;
  if (mode === "tracking") return <LocateFixed size={20} className="text-blue-300/50" />;
  if (mode === "error") return <LocateOff size={20} className="text-white/30" />;
  return <Locate size={20} className="text-white/70" />;
}

export default function LocateButton() {
  const { mode, toggle, isSupported } = useGeolocation();
  const { selectedParking, selectedZone } = useMapSelection();
  const isMobile = useIsMobile();

  if (!isSupported) return null;

  const hasSelection = selectedParking !== null || selectedZone !== null;
  const bottom = isMobile && hasSelection ? "bottom-72" : "bottom-6";

  return (
    <button
      onClick={toggle}
      aria-label="Me localiser"
      className={`absolute right-3 z-[1000] w-10 h-10 rounded-full bg-black/80 border border-white/10 shadow-lg flex items-center justify-center hover:bg-black/90 transition-[bottom,background-color] duration-300 ${bottom}`}
    >
      <Icon mode={mode} />
    </button>
  );
}
