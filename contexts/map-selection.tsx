"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { SelectedParking } from "@/types/parking";

type MapSelectionContextValue = {
  selectedParking: SelectedParking | null;
  selectedZone: string | null;
  selectParking: (p: SelectedParking) => void;
  selectZone: (color: string) => void;
  clearSelection: () => void;
};

const MapSelectionContext = createContext<MapSelectionContextValue | null>(null);

export function MapSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedParking, setSelectedParking] = useState<SelectedParking | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const selectParking = useCallback((p: SelectedParking) => {
    setSelectedZone(null);
    setSelectedParking(p);
  }, []);

  const selectZone = useCallback((color: string) => {
    setSelectedParking(null);
    setSelectedZone(color);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedParking(null);
    setSelectedZone(null);
  }, []);

  return (
    <MapSelectionContext.Provider
      value={{ selectedParking, selectedZone, selectParking, selectZone, clearSelection }}
    >
      {children}
    </MapSelectionContext.Provider>
  );
}

export function useMapSelection(): MapSelectionContextValue {
  const ctx = useContext(MapSelectionContext);
  if (!ctx) throw new Error("useMapSelection must be used within MapSelectionProvider");
  return ctx;
}
