"use client";

import { MapContainer, TileLayer } from "react-leaflet";
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
import UserLocationLayer from "@/components/map/UserLocationLayer";
import LocateButton from "@/components/map/LocateButton";
import { GeolocationProvider } from "@/contexts/geolocation";
import { MAP_CENTER, MAP_ZOOM, MAP_TILE_URL } from "@/lib/constants";
import "leaflet/dist/leaflet.css";

export default function Map() {
  return (
    <FiltersProvider>
      <MapSelectionProvider>
        <GeolocationProvider>
          <div className="relative h-full w-full">
            <MapContainer
              center={MAP_CENTER}
              zoom={MAP_ZOOM}
              zoomControl={false}
              className="h-full w-full bg-[#3b373f]"
            >
              <TileLayer url={MAP_TILE_URL} />
              <ZonesLayer />
              <OsmFootprintsLayer />
              <ParkingsLayer />
              <ParkingFootprintLayer />
              <UserLocationLayer />
            </MapContainer>
            <FilterBar>
              <DurationFilter />
              <ParkingFilters />
            </FilterBar>
            <ZoneLegend />
            <ZoneBottomSheet />
            <ParkingBottomSheet />
            <LocateButton />
          </div>
        </GeolocationProvider>
      </MapSelectionProvider>
    </FiltersProvider>
  );
}
