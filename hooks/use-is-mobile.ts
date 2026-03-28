"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useIsMobile(breakpoint = 768) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    [breakpoint]
  );

  const getSnapshot = useCallback(
    () => !window.matchMedia(`(min-width: ${breakpoint}px)`).matches,
    [breakpoint]
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
