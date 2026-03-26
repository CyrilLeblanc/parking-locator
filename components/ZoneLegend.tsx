"use client";

import { useEffect, useState } from "react";
import {
  ZONE_COLORS,
  ZONE_SCHEDULE,
  getZoneStatus,
  type ZoneStatus,
} from "@/lib/zoneConfig";

const STATUS_BADGE: Record<ZoneStatus, { label: string; cls: string }> = {
  gratuit: { label: "Gratuit", cls: "bg-green-500 text-white" },
  payant: { label: "Payant", cls: "bg-neutral-500/60 text-white" },
  "demi-tarif": { label: "Demi-tarif", cls: "bg-yellow-400 text-black" },
};

type Props = { bottomSheetOpen: boolean };

export default function ZoneLegend({ bottomSheetOpen }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`absolute left-2.5 z-[1000] bg-black/85 rounded-lg px-3.5 py-2.5 text-white text-[13px] leading-[1.7] pointer-events-none transition-[bottom] duration-300 ${
        bottomSheetOpen ? "bottom-72" : "bottom-6"
      }`}
    >
      <div className="font-semibold mb-1 opacity-60 text-[11px] uppercase">
        Zones voirie
      </div>
      {Object.values(ZONE_SCHEDULE).map((info) => {
        const result = getZoneStatus(info.group, now);
        const badge = STATUS_BADGE[result.status];
        return (
          <div key={info.group} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {info.colors.map((c) => (
                <span
                  key={c}
                  className="inline-block w-3 h-3 rounded-sm shrink-0 opacity-85"
                  style={{ background: ZONE_COLORS[c] }}
                />
              ))}
              <span className="opacity-90">
                {info.group === "vert" ? "Longue durée" : "Courte durée"}
              </span>
            </div>
            <span
              className={`text-[10px] font-semibold rounded-full px-1.5 py-px shrink-0 ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
