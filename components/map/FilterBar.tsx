"use client";

export default function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2 overflow-x-auto pointer-events-none">
      <div className="flex gap-2 pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
