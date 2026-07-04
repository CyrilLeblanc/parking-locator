"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { MAP_DATA_SOURCES } from "@/lib/constants";

/**
 * Discrete "i" button (bottom-left) toggling a panel that lists every data source
 * rendered on the map and its license. Replaces Leaflet's default attribution prefix
 * (attributionControl is disabled on the MapContainer) while keeping OSM's ODbL
 * attribution accessible.
 */
export default function AttributionButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-6 left-3 z-[1000]">
      {open && (
        <>
          {/* Click-away catcher: closes the panel when interacting with the map below. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[999] cursor-default"
          />
          <div className="absolute bottom-10 left-0 z-[1001] w-72 rounded-xl border border-white/10 bg-black/90 p-4 text-white shadow-xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-white">Sources &amp; licences</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded p-1 text-white/50 transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <ul className="space-y-3 text-xs">
              {MAP_DATA_SOURCES.map((source) => (
                <li key={source.id}>
                  <div className="font-medium text-white/90">{source.label}</div>
                  <div className="text-white/60">{source.provider}</div>
                  <div className="text-white/40">{source.license}</div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Sources et licences des données"
        aria-expanded={open}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/60 transition-colors hover:bg-black/80 hover:text-white/90"
      >
        <Info size={14} />
      </button>
    </div>
  );
}
