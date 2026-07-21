"use client";

import { useState } from "react";
import type { Feature, Point } from "geojson";
import { useParkings } from "@/hooks/use-parkings";
import { useParkingSearch } from "@/hooks/use-parking-search";
import { useMapSelection } from "@/contexts/map-selection";
import { useGeolocation } from "@/contexts/geolocation";
import { useMapInstance, panToParking } from "@/contexts/map-instance";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { featureToSelectedParking } from "@/lib/parking-selection";
import SearchBar from "./SearchBar";
import SearchResults from "./SearchResults";

const MIN_QUERY_LENGTH = 2;

// Search overlay: input + ranked results panel. Reuses the existing selection
// flow (selectParking) and pans the map to the chosen parking.
export default function SearchPanel() {
  const [q, setQ] = useState("");
  const isMobile = useIsMobile();
  const { parkings, availability } = useParkings();
  const { position } = useGeolocation();
  const { selectParking } = useMapSelection();
  const mapRef = useMapInstance();

  const lat = position?.latitude;
  const lng = position?.longitude;
  const { data, isPending, isError } = useParkingSearch(q, lat, lng);

  const handleSelect = (feature: Feature) => {
    const id = feature.id as string;
    selectParking(featureToSelectedParking(feature, availability[id]?.free_spaces ?? null));
    const [lng, lat] = (feature.geometry as Point).coordinates;
    if (mapRef.current) {
      panToParking(mapRef.current, { lat, lng }, isMobile);
    }
  };

  const showResults = q.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      <SearchBar value={q} onChange={setQ} />
      {showResults && (
        <SearchResults
          result={data}
          isPending={isPending}
          isError={isError}
          parkings={parkings}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
