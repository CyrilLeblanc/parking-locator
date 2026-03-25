"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import ZonesLayer from "./ZonesLayer";
import ParkingsLayer from "./ParkingsLayer";
import ParkingLegend from "./ParkingLegend";
import ZoneLegend from "./ZoneLegend";
import "leaflet/dist/leaflet.css";

export default function Map() {
  return (
    <MapContainer
      center={[45.1885, 5.7245]}
      zoom={14}
      className="h-full w-full bg-[#3b373f]"
    >
      <TileLayer url="https://data.mobilites-m.fr/carte-dark/{z}/{x}/{y}.png" />
      <ZonesLayer />
      <ParkingsLayer />
      <ParkingLegend />
      <ZoneLegend />
    </MapContainer>
  );
}
