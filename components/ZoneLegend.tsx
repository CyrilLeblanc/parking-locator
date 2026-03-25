import { ZONE_COLORS, ZONE_PRICES } from "@/lib/zoneConfig";

export default function ZoneLegend() {
  return (
    <div className="absolute bottom-6 left-2.5 z-[1000] bg-black/85 rounded-lg px-3.5 py-2.5 text-white text-[13px] leading-[1.7] pointer-events-none">
      <div className="font-semibold mb-1 opacity-60 text-[11px] uppercase">
        Zones voirie
      </div>
      {Object.entries(ZONE_COLORS).map(([zone, color]) => (
        <div key={zone} className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-sm shrink-0 opacity-85"
            style={{ background: color }}
          />
          <span>{ZONE_PRICES[zone]}</span>
        </div>
      ))}
    </div>
  );
}
