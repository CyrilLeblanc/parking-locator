const AVAILABILITY_LEGEND = [
  { color: "#4caf50", label: "Places disponibles" },
  { color: "#f44336", label: "Complet" },
  { color: "#7b8fa1", label: "Pas de données" },
];

export default function ParkingLegend() {
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
        Disponibilité
      </div>
      {AVAILABILITY_LEGEND.map(({ color, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: color,
            }}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
