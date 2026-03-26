"use client";

import { useState } from "react";
import { ClockIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useFilters } from "@/contexts/filters";
import { formatDuration } from "@/lib/fareEstimation";

const PRESETS = [15, 30, 60, 120, 180, 240, 480, 1440];

export default function DurationFilter() {
  const { estimationDuration, setEstimationDuration } = useFilters();
  const [open, setOpen] = useState(false);

  function handleSelect(minutes: number) {
    setEstimationDuration(minutes);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setEstimationDuration(null);
  }

  return (
    <>
      <Button
        variant={estimationDuration !== null ? "default" : "secondary"}
        size="sm"
        className="rounded-full shadow-md gap-1.5 h-8 text-xs font-medium"
        onClick={() => setOpen(true)}
      >
        <ClockIcon className="size-3.5" />
        {estimationDuration !== null ? formatDuration(estimationDuration) : "Estimer"}
        {estimationDuration !== null && (
          <span
            role="button"
            aria-label="Supprimer"
            onClick={handleClear}
            className="ml-0.5 opacity-70 hover:opacity-100"
          >
            <XIcon className="size-3" />
          </span>
        )}
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="z-[3000]">
          <DrawerTitle className="sr-only">Durée de stationnement</DrawerTitle>
          <DrawerDescription className="sr-only">Choisissez une durée pour estimer le coût</DrawerDescription>
          <div className="px-5 pb-8 pt-4">
            <p className="text-sm font-semibold mb-4">Durée de stationnement</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((minutes) => (
                <Button
                  key={minutes}
                  variant={estimationDuration === minutes ? "default" : "secondary"}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => handleSelect(minutes)}
                >
                  {formatDuration(minutes)}
                </Button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
