import { ZONE_COLORS, ZONE_PRICES } from "@/lib/zoneConfig";
import { FACILITY_COLORS, FACILITY_LABELS } from "@/lib/parkingConfig";

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
      <div style={{ fontWeight: 600, marginBottom: 4, opacity: 0.6, fontSize: 11, textTransform: "uppercase" }}>
        Parkings en ouvrage
      </div>
      {Object.entries(FACILITY_COLORS).map(([type, color]) => (
        <div key={type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: color,
              opacity: 0.85,
            }}
          />
          <span>{FACILITY_LABELS[type]}</span>
        </div>
      ))}
      <div style={{ fontWeight: 600, marginTop: 10, marginBottom: 4, opacity: 0.6, fontSize: 11, textTransform: "uppercase" }}>
        Disponibilité
      </div>
      {[
        { color: "#4caf50", label: "Places disponibles" },
        { color: "#f44336", label: "Complet" },
        { color: "#999",    label: "Pas de données" },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: color, opacity: 0.85 }} />
          <span>{label}</span>
        </div>
      ))}
      <div style={{ fontWeight: 600, marginTop: 10, marginBottom: 4, opacity: 0.6, fontSize: 11, textTransform: "uppercase" }}>
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
