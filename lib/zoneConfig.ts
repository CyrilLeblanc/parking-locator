export const ZONE_COLORS: Record<string, string> = {
  vert: "#4caf50",
  orange: "#ff9800",
  violet: "#9c27b0",
};

// ── Types ────────────────────────────────────────────────────────────────────

export type ZoneGroup = "vert" | "orange_violet";
export type ZoneStatus = "gratuit" | "payant" | "demi-tarif";

export type ZoneStatusResult = {
  status: ZoneStatus;
  nextChange: string | null; // e.g. "12h00", null = pas de changement aujourd'hui
};

type TimeWindow = { from: string; to: string }; // "09:00"

type ZoneScheduleInfo = {
  group: ZoneGroup;
  label: string;
  colors: string[];
  maxDuration: string;
  freeMinutes?: number;
  paidWindows: TimeWindow[];
  halfFareWindows?: TimeWindow[];
  horaires: string;
};

// ── Schedule ─────────────────────────────────────────────────────────────────

export const ZONE_SCHEDULE: Record<ZoneGroup, ZoneScheduleInfo> = {
  vert: {
    group: "vert",
    label: "Zone Verte",
    colors: ["vert"],
    maxDuration: "8h30",
    horaires: "Lun–Sam : 9h–12h et 14h–19h",
    paidWindows: [
      { from: "09:00", to: "12:00" },
      { from: "14:00", to: "19:00" },
    ],
  },
  orange_violet: {
    group: "orange_violet",
    label: "Zones Orange & Violette",
    colors: ["orange", "violet"],
    maxDuration: "3h30",
    freeMinutes: 20,
    horaires: "Lun–Sam : 9h–19h (demi-tarif 12h–14h)",
    paidWindows: [{ from: "09:00", to: "19:00" }],
    halfFareWindows: [{ from: "12:00", to: "14:00" }],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function zoneColorToGroup(zone_color: string): ZoneGroup | null {
  for (const [group, info] of Object.entries(ZONE_SCHEDULE)) {
    if (info.colors.includes(zone_color)) return group as ZoneGroup;
  }
  return null;
}

export function getZoneStatus(group: ZoneGroup, now: Date): ZoneStatusResult {
  const info = ZONE_SCHEDULE[group];
  const dow = now.getDay(); // 0 = dimanche
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Dimanche → toujours gratuit
  if (dow === 0) {
    return { status: "gratuit", nextChange: null };
  }

  // Demi-tarif avant payant (sous-intervalle d'une window payante)
  if (info.halfFareWindows) {
    for (const w of info.halfFareWindows) {
      const from = toMinutes(w.from);
      const to = toMinutes(w.to);
      if (currentMin >= from && currentMin < to) {
        return { status: "demi-tarif", nextChange: formatMinutes(to) };
      }
    }
  }

  // Payant ?
  for (const w of info.paidWindows) {
    const from = toMinutes(w.from);
    const to = toMinutes(w.to);
    if (currentMin >= from && currentMin < to) {
      // Prochain changement = début demi-tarif ou fin de la window
      let next = to;
      if (info.halfFareWindows) {
        for (const hw of info.halfFareWindows) {
          const hwFrom = toMinutes(hw.from);
          if (hwFrom > currentMin && hwFrom < next) next = hwFrom;
        }
      }
      return { status: "payant", nextChange: formatMinutes(next) };
    }
  }

  // Gratuit — prochain début de zone payante
  let nextPaid: number | null = null;
  for (const w of info.paidWindows) {
    const from = toMinutes(w.from);
    if (from > currentMin) {
      if (nextPaid === null || from < nextPaid) nextPaid = from;
    }
  }
  return {
    status: "gratuit",
    nextChange: nextPaid !== null ? formatMinutes(nextPaid) : null,
  };
}
