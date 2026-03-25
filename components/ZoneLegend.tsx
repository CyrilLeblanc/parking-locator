import { ZONE_COLORS, ZONE_PRICES } from "@/lib/zoneConfig";

export default function ZoneLegend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: 10,
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
      <div style={{ fontWeight: 600, marginBottom: 4, opacity: 0.6, fontSize: 11, textTransform: "uppercase" }}>
        Zones voirie
      </div>
      {Object.entries(ZONE_COLORS).map(([zone, color]) => (
        <div key={zone} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
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
