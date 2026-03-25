import { ZONE_COLORS, ZONE_PRICES } from "@/lib/zoneConfig";

export default function MapLegend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        right: 10,
        zIndex: 1000,
        background: "rgba(30,30,30,0.85)",
        borderRadius: 8,
        padding: "10px 14px",
        color: "#fff",
        fontSize: 13,
        lineHeight: "1.7",
        pointerEvents: "none",
      }}
    >
      {Object.entries(ZONE_COLORS).map(([zone, color]) => (
        <div key={zone} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 3,
              background: color,
              opacity: 0.85,
            }}
          />
          <span>{ZONE_PRICES[zone]}</span>
        </div>
      ))}
    </div>
  );
}
