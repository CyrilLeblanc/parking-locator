"use client";

import { useState } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { XIcon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFilters } from "@/contexts/filters";
import { useParkingHistory } from "@/hooks/use-parking-history";
import { NavigateButton } from "@/components/NavigateButton";
import { estimateParkingFare, formatDuration, formatFareValue } from "@/lib/fareEstimation";
import { todayDayOfWeek } from "@/lib/constants";
import type { SelectedParking } from "@/types/parking";

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function ParkingContent({ parking, onClose }: { parking: SelectedParking; onClose: () => void }) {
  const today = todayDayOfWeek();
  const [selectedDay, setSelectedDay] = useState(today);
  const { estimationDuration } = useFilters();
  const { history, loading } = useParkingHistory(parking.source === "osm" ? null : parking.id, selectedDay);

  const occupancyPct =
    parking.free_spaces !== null && parking.total_capacity > 0
      ? Math.round(((parking.total_capacity - parking.free_spaces) / parking.total_capacity) * 100)
      : null;

  const availColor =
    parking.free_spaces === null ? "#7b8fa1" : parking.free_spaces === 0 ? "#f44336" : "#4caf50";

  const fareRows: { label: string; value: number; durationMin?: number }[] = [];
  if (parking.fare_1h != null) fareRows.push({ label: "jusqu'à 1h", value: parking.fare_1h, durationMin: 60 });
  if (parking.fare_2h != null) fareRows.push({ label: "jusqu'à 2h", value: parking.fare_2h, durationMin: 120 });
  if (parking.fare_3h != null) fareRows.push({ label: "jusqu'à 3h", value: parking.fare_3h, durationMin: 180 });
  if (parking.fare_4h != null) fareRows.push({ label: "jusqu'à 4h", value: parking.fare_4h, durationMin: 240 });
  if (parking.fare_24h != null) fareRows.push({ label: "jusqu'à 24h", value: parking.fare_24h, durationMin: 1440 });
  if (parking.subscription_resident != null)
    fareRows.push({ label: "Abo. résident", value: parking.subscription_resident });
  if (parking.subscription_non_resident != null)
    fareRows.push({ label: "Abo. non-résident", value: parking.subscription_non_resident });

  const now = new Date();
  const nowSlot =
    selectedDay === today
      ? Math.floor((now.getHours() * 60 + now.getMinutes()) / 30)
      : null;
  const nowSlotLabel = nowSlot !== null
    ? format(setMinutes(setHours(new Date(0), Math.floor(nowSlot / 2)), nowSlot % 2 === 0 ? 0 : 30), "HH:mm")
    : null;

  const hasLowConfidence =
    history !== null &&
    history.slots.some((s) => s.avg_occupancy !== null && s.sample_count < 20);

  const hasAnyData = history?.slots.some((s) => s.avg_occupancy !== null);

  const dailyMap = new Map(history?.today_slots.map((s) => [s.slot, s.occupancy]) ?? []);
  const isToday = selectedDay === today;

  const chartData = history?.slots.map((s) => ({
    ...s,
    actual_occupancy: isToday ? (dailyMap.get(s.slot) ?? null) : null,
  }));

  // Computed once and reused in both the fare header and the per-row highlight logic
  const estimatedFare =
    estimationDuration !== null
      ? parking.free ? 0 : estimateParkingFare(parking, estimationDuration)
      : null;

  return (
    <div className="px-5 pb-8 pt-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="font-semibold text-base leading-tight">{parking.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {parking.address} · {parking.city}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {FACILITY_LABELS[parking.facility_type] ?? parking.facility_type}
            {parking.total_capacity > 0
              ? ` · ${parking.total_capacity} places`
              : parking.estimated_capacity
              ? ` · ~${parking.estimated_capacity} places (estimation)`
              : null}
          </p>
          {parking.operator && (
            <p className="text-xs text-muted-foreground mt-0.5">Opérateur : {parking.operator}</p>
          )}
          {parking.max_height != null && (
            <p className="text-xs text-muted-foreground mt-0.5">Hauteur max : {parking.max_height}m</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <NavigateButton lat={parking.lat} lng={parking.lng} />
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer">
            <XIcon />
          </Button>
        </div>
      </div>

      {/* Availability */}
      {parking.source !== "osm" && parking.free_spaces !== null && (
        <div className="mb-3">
          <div className="font-bold text-[15px] mb-1.5" style={{ color: availColor }}>
            {parking.free_spaces === 0 ? "Complet" : `${parking.free_spaces} places libres`}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded bg-muted overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${occupancyPct ?? 0}%`, background: availColor }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {parking.free_spaces} / {parking.total_capacity}
            </span>
          </div>
        </div>
      )}

      {/* Badges */}
      {(parking.free || parking.disabled_spaces > 0 || parking.ev_chargers > 0 || parking.bike_spaces > 0 || parking.moto_spaces > 0 || parking.moto_ev_spaces > 0 || parking.carsharing_spaces > 0 || parking.carpool_spaces > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {parking.free && (
            <Badge className="bg-[#4caf50] text-white border-transparent">Gratuit</Badge>
          )}
          {parking.disabled_spaces > 0 && (
            <Badge className="bg-[#2196f3] text-white border-transparent">PMR</Badge>
          )}
          {parking.ev_chargers > 0 && (
            <Badge className="bg-[#ff9800] text-white border-transparent">Borne EV</Badge>
          )}
          {parking.bike_spaces > 0 && (
            <Badge className="bg-[#9c27b0] text-white border-transparent">Vélo</Badge>
          )}
          {parking.moto_spaces > 0 && (
            <Badge variant="outline">Moto</Badge>
          )}
          {parking.moto_ev_spaces > 0 && (
            <Badge variant="outline">Moto EV</Badge>
          )}
          {parking.carsharing_spaces > 0 && (
            <Badge variant="outline">Autopartage</Badge>
          )}
          {parking.carpool_spaces > 0 && (
            <Badge variant="outline">Covoiturage</Badge>
          )}
        </div>
      )}

      {/* Fares */}
      {fareRows.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Tarifs</p>
            {estimatedFare !== null && (
              <span className="text-xs font-semibold text-primary">
                {formatDuration(estimationDuration!)} → {formatFareValue(estimatedFare)}
              </span>
            )}
          </div>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {fareRows.map(({ label, value, durationMin }) => {
                const isHighlighted =
                  estimatedFare !== null &&
                  !parking.free &&
                  estimatedFare === value &&
                  (durationMin ?? Infinity) >= estimationDuration!;
                return (
                  <tr
                    key={label}
                    className={`border-b border-border last:border-0 ${isHighlighted ? "bg-primary/5" : ""}`}
                  >
                    <td className="py-1 text-muted-foreground">{label}</td>
                    <td className="py-1 text-right font-medium">{formatFareValue(value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {parking.info && (
        <div className="mb-3 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          {parking.info}
        </div>
      )}

      {parking.info_url && (
        <a
          href={parking.info_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-3 text-xs text-primary underline underline-offset-2"
        >
          Site de l&apos;opérateur →
        </a>
      )}

      {parking.source === "osm" ? (
        <div className="mt-1 text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          Données OpenStreetMap · pas de données temps réel
        </div>
      ) : (
        <>
          <Separator className="mb-4" />

          {/* History */}
          <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">
            Occupation typique
          </p>

          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {DAY_LABELS.map((label, i) => (
              <Button
                key={i}
                variant={selectedDay === i ? "default" : "secondary"}
                size="xs"
                className={`shrink-0 rounded-full ${i === today && selectedDay !== i ? "ring-1 ring-border" : ""}`}
                onClick={() => setSelectedDay(i)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="h-[160px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Chargement…
              </div>
            ) : !hasAnyData ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center">
                Pas encore de données
                <br />
                <span className="text-xs">Disponible après quelques jours de collecte</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9e9e9e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#9e9e9e" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="todayGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976d2" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1976d2" stopOpacity={0.05} />
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
                    formatter={(value: number, name: string) => {
                      if (name === "avg_occupancy") return [`${Math.round(value)}%`, "Tendance"];
                      if (name === "actual_occupancy") return [`${Math.round(value)}%`, "Aujourd'hui"];
                      return [`${Math.round(value)}%`, name];
                    }}
                    labelFormatter={(label) => label || ""}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  {nowSlotLabel !== null && (
                    <ReferenceLine
                      x={nowSlotLabel}
                      stroke="#1976d2"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="avg_occupancy"
                    stroke="#bdbdbd"
                    strokeWidth={1.5}
                    fill="url(#trendGradient)"
                    connectNulls={false}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                  {isToday && (
                    <Area
                      type="monotone"
                      dataKey="actual_occupancy"
                      stroke="#1976d2"
                      strokeWidth={2}
                      fill="url(#todayGradient)"
                      connectNulls={false}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {hasLowConfidence && !loading && hasAnyData && (
            <div className="mt-2 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Données limitées — moins de 20 relevés par créneau
            </div>
          )}
        </>
      )}
    </div>
  );
}
