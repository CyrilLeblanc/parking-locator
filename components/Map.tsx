"use client";

import { useCallback, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import ZonesLayer from "./ZonesLayer";
import ParkingsLayer from "./ParkingsLayer";
import ParkingLegend from "./ParkingLegend";
import ZoneLegend from "./ZoneLegend";
import ZoneBottomSheet from "./ZoneBottomSheet";
import ParkingBottomSheet, { type SelectedParking } from "./ParkingBottomSheet";
import "leaflet/dist/leaflet.css";

export default function Map() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedParking, setSelectedParking] = useState<SelectedParking | null>(null);

  const handleZoneClick = useCallback((zone_color: string) => {
    setSelectedParking(null);
    setSelectedZone(zone_color);
  }, []);

  const handleParkingClick = useCallback((p: SelectedParking) => {
    setSelectedZone(null);
    setSelectedParking(p);
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[45.1885, 5.7245]}
        zoom={14}
        className="h-full w-full bg-[#3b373f]"
      >
        <TileLayer url="https://data.mobilites-m.fr/carte-dark/{z}/{x}/{y}.png" />
        <ZonesLayer onZoneClick={handleZoneClick} />
        <ParkingsLayer onParkingClick={handleParkingClick} />
        <ParkingLegend />
      </MapContainer>
      <ZoneLegend bottomSheetOpen={selectedZone !== null} />
      <ZoneBottomSheet
        zone_color={selectedZone}
        onClose={() => setSelectedZone(null)}
      />
      <ParkingBottomSheet
        parking={selectedParking}
        onClose={() => setSelectedParking(null)}
      />
    </div>
  );
}
