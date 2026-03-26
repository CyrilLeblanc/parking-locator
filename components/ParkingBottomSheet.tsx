"use client";

import { useEffect, useState } from "react";
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
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-is-mobile";

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

function ParkingContent({ parking, onClose }: { parking: SelectedParking; onClose: () => void }) {
  const today = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(today);
  const [history, setHistory] = useState<HistoryData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/parkings/${parking.id}/history?day=${selectedDay}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: HistoryData) => setHistory(data))
      .catch(() => {});
    return () => controller.abort();
  }, [parking.id, selectedDay]);

  const occupancyPct =
    parking.free_spaces !== null && parking.total_capacity > 0
      ? Math.round(((parking.total_capacity - parking.free_spaces) / parking.total_capacity) * 100)
      : null;

  const availColor =
    parking.free_spaces === null ? "#7b8fa1" : parking.free_spaces === 0 ? "#f44336" : "#4caf50";

  const fareRows: { label: string; value: number }[] = [];
  if (parking.fare_1h != null) fareRows.push({ label: "1h", value: parking.fare_1h });
  if (parking.fare_2h != null) fareRows.push({ label: "2h", value: parking.fare_2h });
  if (parking.fare_3h != null) fareRows.push({ label: "3h", value: parking.fare_3h });
  if (parking.fare_4h != null) fareRows.push({ label: "4h", value: parking.fare_4h });
  if (parking.fare_24h != null) fareRows.push({ label: "24h", value: parking.fare_24h });
  if (parking.subscription_resident != null)
    fareRows.push({ label: "Abo. résident", value: parking.subscription_resident });
  if (parking.subscription_non_resident != null)
    fareRows.push({ label: "Abo. non-résident", value: parking.subscription_non_resident });

  const freshHistory =
    history?.parking_id === parking.id && history?.day_of_week === selectedDay ? history : null;
  const isLoading = freshHistory === null;
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
    <div className="px-5 pb-8 pt-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="font-semibold text-base leading-tight">{parking.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {parking.address} · {parking.city}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {FACILITY_LABELS[parking.facility_type] ?? parking.facility_type} ·{" "}
            {parking.total_capacity} places
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer" className="shrink-0 mt-0.5">
          <XIcon />
        </Button>
      </div>

      {/* Availability */}
      {parking.free_spaces !== null && (
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
      {(parking.free || parking.disabled_spaces > 0 || parking.ev_chargers > 0 || parking.bike_spaces > 0) && (
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
        </div>
      )}

      {/* Fares */}
      {fareRows.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1.5">Tarifs</p>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {fareRows.map(({ label, value }) => (
                <tr key={label} className="border-b border-border last:border-0">
                  <td className="py-1 text-muted-foreground">{label}</td>
                  <td className="py-1 text-right font-medium">{formatFare(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
        {isLoading ? (
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

      {hasLowConfidence && !isLoading && hasAnyData && (
        <div className="mt-2 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          Données limitées — moins de 20 relevés par créneau
        </div>
      )}
    </div>
  );
}

export default function ParkingBottomSheet({ parking, onClose }: Props) {
  const isMobile = useIsMobile();
  const handleOpenChange = (open: boolean) => { if (!open) onClose(); };

  if (isMobile) {
    return (
      <Drawer open={parking !== null} onOpenChange={handleOpenChange}>
        <DrawerContent className="z-[2000]">
          {parking && (
            <>
              <DrawerTitle className="sr-only">{parking.name}</DrawerTitle>
              <DrawerDescription className="sr-only">{parking.address}</DrawerDescription>
              <ScrollArea className="overflow-y-auto">
                <ParkingContent parking={parking} onClose={onClose} />
              </ScrollArea>
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={parking !== null} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="z-[2000] w-[400px] sm:max-w-[400px] p-0 flex flex-col gap-0"
      >
        {parking && (
          <>
            <SheetTitle className="sr-only">{parking.name}</SheetTitle>
            <SheetDescription className="sr-only">{parking.address}</SheetDescription>
            <ScrollArea className="flex-1 min-h-0">
              <ParkingContent parking={parking} onClose={onClose} />
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
