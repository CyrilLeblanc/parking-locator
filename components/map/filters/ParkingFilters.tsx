"use client";

import { useState } from "react";
import { Accessibility, Zap, CreditCard, Car, Truck, BadgeDollarSign, SlidersHorizontal, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useFilters } from "@/contexts/filters";
import { useIsMobile } from "@/hooks/use-is-mobile";

const FILTERS = [
  { key: "pmr", icon: Accessibility, label: "PMR" },
  { key: "ev", icon: Zap, label: "EV" },
  { key: "subscription", icon: CreditCard, label: "Abo." },
  { key: "freeOnly", icon: BadgeDollarSign, label: "Gratuit" },
] as const;

const HEIGHT_FILTERS = [
  { value: "suv", icon: Car, label: "SUV" },
  { value: "utility", icon: Truck, label: "Utilitaire" },
] as const;

const pillClass = "rounded-full shadow-md gap-1.5 h-8 text-xs font-medium shrink-0";

function FilterToggles() {
  const { activeFilters, setFilter, clearFilters, activeFilterCount } = useFilters();

  function toggleMaxHeight(value: "suv" | "utility") {
    setFilter("maxHeight", activeFilters.maxHeight === value ? null : value);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {FILTERS.map(({ key, icon: Icon, label }) => (
          <Button
            key={key}
            variant={activeFilters[key] ? "default" : "secondary"}
            size="lg"
            className="flex-col gap-1.5 h-16"
            onClick={() => setFilter(key, !activeFilters[key])}
          >
            <Icon className="size-5" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        ))}
        {HEIGHT_FILTERS.map(({ value, icon: Icon, label }) => (
          <Button
            key={value}
            variant={activeFilters.maxHeight === value ? "default" : "secondary"}
            size="lg"
            className="flex-col gap-1.5 h-16"
            onClick={() => toggleMaxHeight(value)}
          >
            <Icon className="size-5" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        ))}
      </div>
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearFilters}>
          Réinitialiser
        </Button>
      )}
    </>
  );
}

function MobilePill() {
  const { activeFilterCount, clearFilters } = useFilters();
  const [open, setOpen] = useState(false);

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    clearFilters();
  }

  return (
    <>
      <Button
        variant={activeFilterCount > 0 ? "default" : "secondary"}
        size="sm"
        className={pillClass}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-3.5" />
        {activeFilterCount > 0 ? `Filtres ·${activeFilterCount}` : "Filtres"}
        {activeFilterCount > 0 && (
          <span role="button" aria-label="Réinitialiser" onClick={handleClear} className="ml-0.5 opacity-70 hover:opacity-100">
            <XIcon className="size-3" />
          </span>
        )}
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="z-[3000]">
          <DrawerTitle className="sr-only">Filtres</DrawerTitle>
          <DrawerDescription className="sr-only">Filtrer les parkings par critères</DrawerDescription>
          <div className="px-5 pb-8 pt-4">
            <p className="text-sm font-semibold mb-4">Filtres</p>
            <FilterToggles />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function DesktopPills() {
  const { activeFilters, setFilter } = useFilters();

  function toggleMaxHeight(value: "suv" | "utility") {
    setFilter("maxHeight", activeFilters.maxHeight === value ? null : value);
  }

  return (
    <>
      {FILTERS.map(({ key, icon: Icon, label }) => (
        <Button
          key={key}
          variant={activeFilters[key] ? "default" : "secondary"}
          size="sm"
          className={pillClass}
          onClick={() => setFilter(key, !activeFilters[key])}
        >
          <Icon className="size-3.5" />
          {label}
        </Button>
      ))}
      {HEIGHT_FILTERS.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={activeFilters.maxHeight === value ? "default" : "secondary"}
          size="sm"
          className={pillClass}
          onClick={() => toggleMaxHeight(value)}
        >
          <Icon className="size-3.5" />
          {label}
        </Button>
      ))}
    </>
  );
}

export default function ParkingFilters() {
  const isMobile = useIsMobile();
  return isMobile ? <MobilePill /> : <DesktopPills />;
}
