"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import {
  ZONE_COLORS,
  ZONE_SCHEDULE,
  getZoneStatus,
  zoneColorToGroup,
  type ZoneStatus,
} from "@/lib/zoneConfig";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";

const STATUS_STYLE: Record<ZoneStatus, { cls: string; label: string }> = {
  gratuit: { cls: "bg-green-500 text-white border-transparent", label: "Gratuit" },
  payant: { cls: "bg-neutral-500 text-white border-transparent", label: "Payant" },
  "demi-tarif": { cls: "bg-yellow-400 text-black border-transparent", label: "Demi-tarif" },
};

type Props = {
  zone_color: string | null;
  onClose: () => void;
};

function ZoneContent({ zone_color, onClose }: { zone_color: string; onClose: () => void }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const group = zoneColorToGroup(zone_color);
  const info = group ? ZONE_SCHEDULE[group] : null;
  const statusResult = group ? getZoneStatus(group, now) : null;
  const statusStyle = statusResult ? STATUS_STYLE[statusResult.status] : null;

  if (!info || !statusResult || !statusStyle) return null;

  return (
    <div className="px-5 pb-8 pt-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            {info.colors.map((c) => (
              <span
                key={c}
                className="inline-block w-4 h-4 rounded-sm shrink-0"
                style={{ background: ZONE_COLORS[c] }}
              />
            ))}
          </div>
          <h2 className="font-semibold text-base">{info.label}</h2>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer" className="shrink-0">
          <XIcon />
        </Button>
      </div>

      {/* Live status */}
      <div className="flex items-center gap-2 mb-4">
        <Badge className={statusStyle.cls}>{statusStyle.label}</Badge>
        {statusResult.nextChange && (
          <span className="text-sm text-muted-foreground">
            jusqu&apos;à {statusResult.nextChange}
          </span>
        )}
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-normal h-auto">
          Max {info.maxDuration}
        </Badge>
        {info.freeMinutes && (
          <Badge className="rounded-full px-3 py-1 text-xs h-auto bg-green-50 text-green-700 border-transparent">
            {info.freeMinutes} min offertes / jour
          </Badge>
        )}
      </div>

      {/* Fares */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">Tarifs</p>
        <table className="w-full text-sm">
          <tbody>
            {info.tarifRows.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <td className="py-1.5 text-muted-foreground">{row.label}</td>
                <td className="py-1.5 text-right font-medium">{row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule */}
      <div>
        <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1">
          Horaires payants
        </p>
        <p className="text-sm text-muted-foreground">{info.horaires}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          Gratuit dimanches et jours fériés
        </p>
      </div>
    </div>
  );
}

export default function ZoneBottomSheet({ zone_color, onClose }: Props) {
  const isMobile = useIsMobile();
  const handleOpenChange = (open: boolean) => { if (!open) onClose(); };

  if (isMobile) {
    return (
      <Drawer open={zone_color !== null} onOpenChange={handleOpenChange}>
        <DrawerContent className="z-[2000]">
          {zone_color && (
            <>
              <DrawerTitle className="sr-only">Zone de stationnement</DrawerTitle>
              <DrawerDescription className="sr-only">Informations sur la zone</DrawerDescription>
              <ZoneContent zone_color={zone_color} onClose={onClose} />
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={zone_color !== null} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="z-[2000] w-[400px] sm:max-w-[400px] p-0"
      >
        {zone_color && (
          <>
            <SheetTitle className="sr-only">Zone de stationnement</SheetTitle>
            <SheetDescription className="sr-only">Informations sur la zone</SheetDescription>
            <ZoneContent zone_color={zone_color} onClose={onClose} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
