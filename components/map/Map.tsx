"use client";

import { useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { MapSelectionProvider } from "@/contexts/map-selection";
import { FiltersProvider } from "@/contexts/filters";
import ZonesLayer from "@/components/zone/ZonesLayer";
import ParkingsLayer from "@/components/parking/ParkingsLayer";
import ParkingFootprintLayer from "@/components/parking/ParkingFootprintLayer";
import OsmFootprintsLayer from "@/components/parking/OsmFootprintsLayer";
import ZoneLegend from "@/components/zone/ZoneLegend";
import ZoneBottomSheet from "@/components/zone/ZoneBottomSheet";
import ParkingBottomSheet from "@/components/parking/ParkingBottomSheet";
import FilterBar from "@/components/map/FilterBar";
import DurationFilter from "@/components/map/filters/DurationFilter";
import ParkingFilters from "@/components/map/filters/ParkingFilters";
import SearchPanel from "@/components/search/SearchPanel";
import UserLocationLayer from "@/components/map/UserLocationLayer";
import MapControls from "@/components/map/MapControls";
import AttributionButton from "@/components/map/AttributionButton";
import MapHashSync from "@/components/map/MapHashSync";
import { GeolocationProvider } from "@/contexts/geolocation";
import { MapInstanceProvider } from "@/contexts/map-instance";
import { MAP_CENTER, MAP_ZOOM, MAP_TILE_URL } from "@/lib/constants";
import "leaflet/dist/leaflet.css";

export default function Map() {
  const mapRef = useRef<LeafletMap | null>(null);

  return (
    <FiltersProvider>
      <MapSelectionProvider>
        <GeolocationProvider>
          <MapInstanceProvider mapRef={mapRef}>
            <div className="relative h-full w-full">
              <MapContainer
                ref={mapRef}
                center={MAP_CENTER}
                zoom={MAP_ZOOM}
                zoomControl={false}
                attributionControl={false}
                className="h-full w-full"
              >
                <TileLayer url={MAP_TILE_URL} />
                <ZonesLayer />
                <OsmFootprintsLayer />
                <ParkingsLayer />
                <ParkingFootprintLayer />
                <UserLocationLayer />
                <MapHashSync />
              </MapContainer>
              <div className="pointer-events-none absolute left-3 right-3 top-3 z-[1000] flex flex-col gap-2">
                <SearchPanel />
                <FilterBar>
                  <DurationFilter />
                  <ParkingFilters />
                </FilterBar>
              </div>
              <ZoneLegend />
              <ZoneBottomSheet />
              <ParkingBottomSheet />
              <MapControls mapRef={mapRef} />
              <AttributionButton />
            </div>
          </MapInstanceProvider>
        </GeolocationProvider>
      </MapSelectionProvider>
    </FiltersProvider>
  );
}
