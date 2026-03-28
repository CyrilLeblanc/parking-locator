import { parse } from "csv-parse/sync";
import { prisma } from "../prisma";

const CSV_URL =
  "https://data.metropolegrenoble.fr/sites/default/files/dataset/b61/1d794-e7cf-431f-b2bf-f7bbc4df2a88/plan_de_stationnement_zones_tarifaires_grenoble_epsg4326.csv";

const ZONE_COLORS = ["vert", "orange", "violet"] as const;

function extractColor(name: string): string | null {
  const lower = name.toLowerCase();
  for (const color of ZONE_COLORS) {
    if (lower.includes(color)) return color;
  }
  return null;
}

export async function importZones(): Promise<void> {
  console.log("Fetching zones CSV…");
  const response = await fetch(CSV_URL);
  if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);
  const csvText = await response.text();

  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{
    dec_cont_stat_id: string;
    dec_cont_stat_nom: string;
    geo_shape: string;
  }>;

  console.log(`Found ${rows.length} zones. Importing…`);
  await prisma.$executeRaw`TRUNCATE TABLE street_parking_zone`;

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const color = extractColor(row.dec_cont_stat_nom);
    if (!color) {
      console.warn(`  Skipping zone ${row.dec_cont_stat_id} — unknown color in "${row.dec_cont_stat_nom}"`);
      skipped++;
      continue;
    }

    await prisma.$executeRaw`
      INSERT INTO street_parking_zone (id, name, zone_color, geometry)
      VALUES (
        ${row.dec_cont_stat_id},
        ${row.dec_cont_stat_nom},
        ${color},
        ST_GeomFromGeoJSON(${row.geo_shape})
      )
    `;
    imported++;
  }

  console.log(`Done. ${imported} imported, ${skipped} skipped.`);
}
