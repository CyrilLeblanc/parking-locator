"use client";

import { useEffect, useState } from "react";
import {
  ZONE_COLORS,
  ZONE_SCHEDULE,
  getZoneStatus,
  zoneColorToGroup,
  type ZoneStatus,
} from "@/lib/zoneConfig";

const STATUS_STYLE: Record<ZoneStatus, { cls: string; label: string }> = {
  gratuit: { cls: "bg-green-500 text-white", label: "Gratuit" },
  payant: { cls: "bg-neutral-500 text-white", label: "Payant" },
  "demi-tarif": { cls: "bg-yellow-400 text-black", label: "Demi-tarif" },
};

type Props = {
  zone_color: string | null;
  onClose: () => void;
};

export default function ZoneBottomSheet({ zone_color, onClose }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const open = zone_color !== null;
  const group = zone_color ? zoneColorToGroup(zone_color) : null;
  const info = group ? ZONE_SCHEDULE[group] : null;
  const statusResult = group ? getZoneStatus(group, now) : null;
  const statusStyle = statusResult ? STATUS_STYLE[statusResult.status] : null;

  return (
    <div
      className={`fixed inset-0 z-[2000] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      onClick={onClose}
    >
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300" />
        </div>

        {info && statusResult && statusStyle ? (
          <div className="px-5 pb-8 pt-2">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex gap-1">
                {info.colors.map((c) => (
                  <span
                    key={c}
                    className="inline-block w-4 h-4 rounded-sm"
                    style={{ background: ZONE_COLORS[c] }}
                  />
                ))}
              </div>
              <span className="font-semibold text-base text-neutral-800">
                {info.label}
              </span>
            </div>

            {/* Statut live */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-sm font-semibold rounded-full px-3 py-1 ${statusStyle.cls}`}
              >
                {statusStyle.label}
              </span>
              {statusResult.nextChange && (
                <span className="text-sm text-neutral-500">
                  jusqu&apos;à {statusResult.nextChange}
                </span>
              )}
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-xs bg-neutral-100 text-neutral-600 rounded-full px-3 py-1">
                Max {info.maxDuration}
              </span>
              {info.freeMinutes && (
                <span className="text-xs bg-green-50 text-green-700 font-medium rounded-full px-3 py-1">
                  {info.freeMinutes} min offertes / jour
                </span>
              )}
            </div>

            {/* Tarifs */}
            <div className="mb-5">
              <div className="text-[11px] font-semibold uppercase text-neutral-400 mb-2">
                Tarifs
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {info.tarifRows.map((row) => (
                    <tr key={row.label} className="border-b border-neutral-100 last:border-0">
                      <td className="py-1.5 text-neutral-600">{row.label}</td>
                      <td className="py-1.5 text-right font-medium text-neutral-800">
                        {row.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Horaires */}
            <div>
              <div className="text-[11px] font-semibold uppercase text-neutral-400 mb-1">
                Horaires payants
              </div>
              <p className="text-sm text-neutral-600">{info.horaires}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Gratuit dimanches et jours fériés
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
