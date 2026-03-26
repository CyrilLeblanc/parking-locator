"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { FACILITY_LABELS } from "@/lib/parkingConfig";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export type SelectedParking = {
  id: string;
  name: string;
  address: string;
  city: string;
  facility_type: string;
  free: boolean;
  total_capacity: number;
  disabled_spaces: number;
  ev_chargers: number;
  bike_spaces: number;
  fare_1h?: number | null;
  fare_2h?: number | null;
  fare_3h?: number | null;
  fare_4h?: number | null;
  fare_24h?: number | null;
  subscription_resident?: number | null;
  subscription_non_resident?: number | null;
  free_spaces: number | null;
};

type HistorySlot = {
  slot: number;
  time: string;
  avg_occupancy: number | null;
  sample_count: number;
};

type HistoryData = {
  parking_id: string;
  parking_name: string;
  total_capacity: number;
  day_of_week: number;
  slots: HistorySlot[];
};

type Props = {
  parking: SelectedParking | null;
  onClose: () => void;
};

function formatFare(value: number): string {
  return value % 1 === 0 ? `${value} €` : `${value.toFixed(2).replace(".", ",")} €`;
}

export default function ParkingBottomSheet({ parking, onClose }: Props) {
  const today = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(today);
  const [history, setHistory] = useState<HistoryData | null>(null);

  useEffect(() => {
    if (!parking) return;
    const controller = new AbortController();
    fetch(`/api/parkings/${parking.id}/history?day=${selectedDay}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: HistoryData) => setHistory(data))
      .catch(() => {});
    return () => controller.abort();
  }, [parking?.id, selectedDay]);

  const open = parking !== null;

  const occupancyPct =
    parking && parking.free_spaces !== null && parking.total_capacity > 0
      ? Math.round(((parking.total_capacity - parking.free_spaces) / parking.total_capacity) * 100)
      : null;

  const availColor =
    parking?.free_spaces === null
      ? "#7b8fa1"
      : parking?.free_spaces === 0
        ? "#f44336"
        : "#4caf50";

  const hasFares =
    parking &&
    [
      parking.fare_1h,
      parking.fare_2h,
      parking.fare_3h,
      parking.fare_4h,
      parking.fare_24h,
      parking.subscription_resident,
      parking.subscription_non_resident,
    ].some((v) => v != null);

  const fareRows: { label: string; value: number }[] = [];
  if (parking) {
    if (parking.fare_1h != null) fareRows.push({ label: "1h", value: parking.fare_1h });
    if (parking.fare_2h != null) fareRows.push({ label: "2h", value: parking.fare_2h });
    if (parking.fare_3h != null) fareRows.push({ label: "3h", value: parking.fare_3h });
    if (parking.fare_4h != null) fareRows.push({ label: "4h", value: parking.fare_4h });
    if (parking.fare_24h != null) fareRows.push({ label: "24h", value: parking.fare_24h });
    if (parking.subscription_resident != null)
      fareRows.push({ label: "Abo. résident", value: parking.subscription_resident });
    if (parking.subscription_non_resident != null)
      fareRows.push({ label: "Abo. non-résident", value: parking.subscription_non_resident });
  }

  // History is "fresh" only when it matches the current parking+day
  const freshHistory =
    history?.parking_id === parking?.id && history?.day_of_week === selectedDay
      ? history
      : null;

  const isLoading = parking !== null && freshHistory === null;

  const chartData = freshHistory?.slots;

  const nowSlot =
    selectedDay === today
      ? Math.floor((new Date().getHours() * 60 + new Date().getMinutes()) / 30)
      : null;

  const hasLowConfidence =
    freshHistory !== null &&
    freshHistory.slots.some((s) => s.avg_occupancy !== null && s.sample_count < 20);

  const hasAnyData = freshHistory?.slots.some((s) => s.avg_occupancy !== null);

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

        {parking && (
          <div className="px-5 pb-8 pt-2 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="font-semibold text-base text-neutral-800 leading-tight">
                  {parking.name}
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {parking.address} · {parking.city}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {FACILITY_LABELS[parking.facility_type] ?? parking.facility_type} ·{" "}
                  {parking.total_capacity} places
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 text-xl leading-none mt-0.5 shrink-0"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {/* Availability */}
            {parking.free_spaces !== null && (
              <div className="mb-3">
                <div className="font-bold text-[15px] mb-1.5" style={{ color: availColor }}>
                  {parking.free_spaces === 0 ? "Complet" : `${parking.free_spaces} places libres`}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${occupancyPct ?? 0}%`,
                        background: availColor,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                    {parking.free_spaces} / {parking.total_capacity}
                  </span>
                </div>
              </div>
            )}

            {/* Badges */}
            {(parking.free ||
              parking.disabled_spaces > 0 ||
              parking.ev_chargers > 0 ||
              parking.bike_spaces > 0) && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {parking.free && (
                  <span className="text-white rounded px-1.5 py-px text-[11px] font-semibold bg-[#4caf50]">
                    Gratuit
                  </span>
                )}
                {parking.disabled_spaces > 0 && (
                  <span className="text-white rounded px-1.5 py-px text-[11px] font-semibold bg-[#2196f3]">
                    PMR
                  </span>
                )}
                {parking.ev_chargers > 0 && (
                  <span className="text-white rounded px-1.5 py-px text-[11px] font-semibold bg-[#ff9800]">
                    Borne EV
                  </span>
                )}
                {parking.bike_spaces > 0 && (
                  <span className="text-white rounded px-1.5 py-px text-[11px] font-semibold bg-[#9c27b0]">
                    Vélo
                  </span>
                )}
              </div>
            )}

            {/* Fares */}
            {hasFares && fareRows.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-semibold uppercase text-neutral-400 mb-1.5">
                  Tarifs
                </div>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    {fareRows.map(({ label, value }) => (
                      <tr key={label} className="border-b border-neutral-100 last:border-0">
                        <td className="py-1 text-neutral-500">{label}</td>
                        <td className="py-1 text-right font-medium text-neutral-700">
                          {formatFare(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Separator */}
            <hr className="border-neutral-100 mb-4" />

            {/* History section */}
            <div className="text-[11px] font-semibold uppercase text-neutral-400 mb-2">
              Occupation typique
            </div>

            {/* Day selector */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    selectedDay === i
                      ? "bg-neutral-800 text-white"
                      : i === today
                        ? "bg-neutral-100 text-neutral-800 ring-1 ring-neutral-300"
                        : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="h-[160px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-sm text-neutral-400">
                  Chargement…
                </div>
              ) : !hasAnyData ? (
                <div className="h-full flex items-center justify-center text-sm text-neutral-400 text-center">
                  Pas encore de données
                  <br />
                  <span className="text-xs">Disponible après quelques jours de collecte</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f44336" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f44336" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: "#9e9e9e" }}
                      tickLine={false}
                      axisLine={false}
                      interval={3}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "#9e9e9e" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                      ticks={[0, 50, 100]}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${Math.round(value)}%`, "Occupation"]}
                      labelFormatter={(label) => label || ""}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    {nowSlot !== null && (
                      <ReferenceLine
                        x={`${Math.floor(nowSlot / 2).toString().padStart(2, "0")}:${nowSlot % 2 === 0 ? "00" : "30"}`}
                        stroke="#1976d2"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="avg_occupancy"
                      stroke="#f44336"
                      strokeWidth={2}
                      fill="url(#occupancyGradient)"
                      connectNulls={false}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Low confidence warning */}
            {hasLowConfidence && !isLoading && hasAnyData && (
              <div className="mt-2 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                Données limitées — moins de 20 relevés par créneau
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
