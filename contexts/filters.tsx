"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

export type ActiveFilters = {
  pmr: boolean;
  ev: boolean;
  subscription: boolean;
  maxHeight: "suv" | "utility" | null;
  freeOnly: boolean;
};

const filtersParsers = {
  duration: parseAsInteger,
  pmr: parseAsBoolean.withDefault(false),
  ev: parseAsBoolean.withDefault(false),
  subscription: parseAsBoolean.withDefault(false),
  freeOnly: parseAsBoolean.withDefault(false),
  maxHeight: parseAsStringLiteral(["suv", "utility"] as const),
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
  const [params, setParams] = useQueryStates(filtersParsers, { history: "replace" });

  const estimationDuration = params.duration;

  const setEstimationDuration = useCallback(
    (minutes: number | null) => setParams({ duration: minutes }),
    [setParams]
  );

  const activeFilters: ActiveFilters = useMemo(
    () => ({
      pmr: params.pmr,
      ev: params.ev,
      subscription: params.subscription,
      freeOnly: params.freeOnly,
      maxHeight: params.maxHeight,
    }),
    [params.pmr, params.ev, params.subscription, params.freeOnly, params.maxHeight]
  );

  const setFilter = useCallback(
    <K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) => {
      setParams({ [key]: value } as Partial<typeof params>);
    },
    [setParams]
  );

  const clearFilters = useCallback(() => {
    setParams({ pmr: false, ev: false, subscription: false, freeOnly: false, maxHeight: null });
  }, [setParams]);

  const activeFilterCount = useMemo(
    () =>
      (activeFilters.pmr ? 1 : 0) +
      (activeFilters.ev ? 1 : 0) +
      (activeFilters.subscription ? 1 : 0) +
      (activeFilters.maxHeight !== null ? 1 : 0) +
      (activeFilters.freeOnly ? 1 : 0),
    [activeFilters]
  );

  const value = useMemo(
    () => ({
      estimationDuration,
      setEstimationDuration,
      activeFilters,
      setFilter,
      clearFilters,
      activeFilterCount,
    }),
    [estimationDuration, setEstimationDuration, activeFilters, setFilter, clearFilters, activeFilterCount]
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
