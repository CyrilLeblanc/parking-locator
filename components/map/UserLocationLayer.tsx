"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGeolocation } from "@/contexts/geolocation";

const DOT_HTML = `
  <div style="position:relative;width:30px;height:30px;display:flex;align-items:center;justify-content:center;">
    <div class="user-location-pulse"></div>
    <div style="
      width:14px;height:14px;border-radius:50%;
      background:#2979ff;border:2px solid #fff;
      box-shadow:0 1px 4px rgba(41,121,255,0.5);
      position:relative;z-index:1;
    "></div>
  </div>
`;

export default function UserLocationLayer() {
  const map = useMap();
  const { mode, position, setMode } = useGeolocation();
  const dotRef = useRef<L.Marker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Register drag handler once — switches following → tracking
  useEffect(() => {
    const onDragStart = () => {
      if (modeRef.current === "following") setMode("tracking");
    };
    map.on("dragstart", onDragStart);
    return () => { map.off("dragstart", onDragStart); };
  }, [map, setMode]);

  // Create/update/remove dot and accuracy circle
  useEffect(() => {
    if (!position) {
      dotRef.current?.remove(); dotRef.current = null;
      accuracyRef.current?.remove(); accuracyRef.current = null;
      return;
    }

    const latlng = L.latLng(position.latitude, position.longitude);

    if (!dotRef.current) {
      const icon = L.divIcon({
        html: DOT_HTML,
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      dotRef.current = L.marker(latlng, { icon, interactive: false, zIndexOffset: 1000 }).addTo(map);
      accuracyRef.current = L.circle(latlng, {
        radius: position.accuracy,
        color: "#2979ff",
        weight: 1,
        fillColor: "#2979ff",
        fillOpacity: 0.1,
        interactive: false,
      }).addTo(map);
    } else {
      dotRef.current.setLatLng(latlng);
      accuracyRef.current?.setLatLng(latlng);
      accuracyRef.current?.setRadius(position.accuracy);
    }
  }, [position, map]);

  // Auto-pan when in following mode
  useEffect(() => {
    if (mode !== "following" || !position) return;
    const latlng = L.latLng(position.latitude, position.longitude);
    map.setView(latlng, Math.max(map.getZoom(), 15), { animate: true });
  }, [position, mode, map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dotRef.current?.remove();
      accuracyRef.current?.remove();
    };
  }, []);

  return null;
}
