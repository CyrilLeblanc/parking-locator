const AVAILABILITY_LEGEND = [
  { color: "#4caf50", label: "Places disponibles" },
  { color: "#f44336", label: "Complet" },
  { color: "#7b8fa1", label: "Pas de données" },
];

export default function ParkingLegend() {
  return (
    <div className="absolute bottom-6 right-2.5 z-[1000] bg-black/85 rounded-lg px-3.5 py-2.5 text-white text-[13px] leading-[1.7] pointer-events-none">
      <div className="font-semibold mb-1 opacity-60 text-[11px] uppercase">
        Disponibilité
      </div>
      {AVAILABILITY_LEGEND.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{ background: color }}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
