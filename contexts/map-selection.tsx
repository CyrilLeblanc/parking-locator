"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import type { SelectedParking } from "@/types/parking";
import type { ZoneFeatureProperties } from "@/types/zone";

type MapSelectionContextValue = {
  selectedParking: SelectedParking | null;
  selectedZone: ZoneFeatureProperties | null;
  selectedParkingId: string | null;
  selectParking: (p: SelectedParking) => void;
  selectZone: (props: ZoneFeatureProperties) => void;
  clearSelection: () => void;
};

const MapSelectionContext = createContext<MapSelectionContextValue | null>(null);

export function MapSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedParking, setSelectedParking] = useState<SelectedParking | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneFeatureProperties | null>(null);
  const [selectedParkingId, setSelectedParkingId] = useQueryState(
    "parking",
    parseAsString.withOptions({ history: "replace" })
  );

  const selectParking = useCallback(
    (p: SelectedParking) => {
      setSelectedZone(null);
      setSelectedParking(p);
      setSelectedParkingId(p.id);
    },
    [setSelectedParkingId]
  );

  const selectZone = useCallback((props: ZoneFeatureProperties) => {
    setSelectedParking(null);
    setSelectedParkingId(null);
    setSelectedZone(props);
  }, [setSelectedParkingId]);

  const clearSelection = useCallback(() => {
    setSelectedParking(null);
    setSelectedZone(null);
    setSelectedParkingId(null);
  }, [setSelectedParkingId]);

  return (
    <MapSelectionContext.Provider
      value={{ selectedParking, selectedZone, selectedParkingId, selectParking, selectZone, clearSelection }}
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
