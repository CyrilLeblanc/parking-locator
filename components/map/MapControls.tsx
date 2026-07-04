"use client";

import type { RefObject } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Minus, Plus } from "lucide-react";
import { LocateButtonControl } from "@/components/map/LocateButton";
import { useMapSelection } from "@/contexts/map-selection";
import { useIsMobile } from "@/hooks/use-is-mobile";

/** Shared styling for every control button in the cluster. */
const CONTROL_BUTTON_CLASS =
  "w-10 h-10 rounded-full bg-black/80 border border-white/10 shadow-lg flex items-center justify-center hover:bg-black/90 transition-colors";

/**
 * Right-docked map controls: zoom in / zoom out / locate.
 * Lives outside <MapContainer> (like the other overlays) and receives the map
 * instance via `mapRef` instead of useMap(), since useMap() requires Leaflet
 * context that only exists inside the container.
 * Clustered so the buttons stack vertically and shift together when a bottom
 * sheet opens on mobile, keeping a consistent dock above the sheet.
 */
export default function MapControls({ mapRef }: { mapRef: RefObject<LeafletMap | null> }) {
  const { selectedParking, selectedZone } = useMapSelection();
  const isMobile = useIsMobile();

  const hasSelection = selectedParking !== null || selectedZone !== null;
  const bottom = isMobile && hasSelection ? "bottom-72" : "bottom-6";

  return (
    <div
      className={`absolute right-3 z-[1000] ${bottom} flex flex-col gap-2 transition-[bottom] duration-300`}
    >
      <button
        type="button"
        onClick={() => mapRef.current?.zoomIn()}
        aria-label="Zoomer"
        className={CONTROL_BUTTON_CLASS}
      >
        <Plus size={20} className="text-white/70" />
      </button>
      <button
        type="button"
        onClick={() => mapRef.current?.zoomOut()}
        aria-label="Dézoomer"
        className={CONTROL_BUTTON_CLASS}
      >
        <Minus size={20} className="text-white/70" />
      </button>
      <LocateButtonControl className={CONTROL_BUTTON_CLASS} />
    </div>
  );
}
