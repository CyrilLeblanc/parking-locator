"use client";

// Pill row for the active filters. Positioned by its parent overlay in Map.tsx
// (it stacks below the search bar). The row is interactive; the surrounding
// overlay container handles the pointer-events-none pass-through to the map.
export default function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto flex gap-2 overflow-x-auto">
      {children}
    </div>
  );
}
