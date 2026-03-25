"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import ZonesLayer from "./ZonesLayer";
import ParkingsLayer from "./ParkingsLayer";
import MapLegend from "./MapLegend";
import "leaflet/dist/leaflet.css";

export default function Map() {
  return (
    <MapContainer
      center={[45.1885, 5.7245]}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://data.mobilites-m.fr/carte-dark/{z}/{x}/{y}.png" />
      <ZonesLayer />
      <ParkingsLayer />
      <MapLegend />
    </MapContainer>
  );
}
