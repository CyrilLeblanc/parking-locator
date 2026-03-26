"use client";

import { createContext, useCallback, useContext, useState } from "react";

type FiltersContextValue = {
  estimationDuration: number | null; // minutes
  setEstimationDuration: (minutes: number | null) => void;
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [estimationDuration, setEstimationDurationRaw] = useState<number | null>(null);

  const setEstimationDuration = useCallback((minutes: number | null) => {
    setEstimationDurationRaw(minutes);
  }, []);

  return (
    <FiltersContext.Provider value={{ estimationDuration, setEstimationDuration }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
