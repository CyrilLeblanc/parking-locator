"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ActiveFilters = {
  pmr: boolean;
  ev: boolean;
  subscription: boolean;
  maxHeight: "suv" | "utility" | null;
  freeOnly: boolean;
};

const DEFAULT_FILTERS: ActiveFilters = {
  pmr: false,
  ev: false,
  subscription: false,
  maxHeight: null,
  freeOnly: false,
};

type FiltersContextValue = {
  estimationDuration: number | null;
  setEstimationDuration: (minutes: number | null) => void;
  activeFilters: ActiveFilters;
  setFilter: <K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [estimationDuration, setEstimationDurationRaw] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

  const setEstimationDuration = useCallback((minutes: number | null) => {
    setEstimationDurationRaw(minutes);
  }, []);

  const setFilter = useCallback(<K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => {
    return (
      (activeFilters.pmr ? 1 : 0) +
      (activeFilters.ev ? 1 : 0) +
      (activeFilters.subscription ? 1 : 0) +
      (activeFilters.maxHeight !== null ? 1 : 0) +
      (activeFilters.freeOnly ? 1 : 0)
    );
  }, [activeFilters]);

  const value = useMemo(
    () => ({ estimationDuration, setEstimationDuration, activeFilters, setFilter, clearFilters, activeFilterCount }),
    [estimationDuration, setEstimationDuration, activeFilters, setFilter, clearFilters, activeFilterCount]
  );

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
