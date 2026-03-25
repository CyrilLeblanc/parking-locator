import "dotenv/config";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const CSV_URL =
  "https://data.metropolegrenoble.fr/sites/default/files/dataset/b61/1d794-e7cf-431f-b2bf-f7bbc4df2a88/plan_de_stationnement_zones_tarifaires_grenoble_epsg4326.csv";

// Approximate Grenoble street parking fares by zone colour
const FARE_BY_COLOR: Record<string, number> = {
  vert: 1.5,
  orange: 2.5,
  violet: 3.5,
};

function extractColor(name: string): string | null {
  const lower = name.toLowerCase();
  for (const color of Object.keys(FARE_BY_COLOR)) {
    if (lower.includes(color)) return color;
  }
  return null;
}

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching CSV…");
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }
  const csvText = await response.text();

  console.log("Parsing CSV…");
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{
    dec_cont_stat_id: string;
    dec_cont_stat_num: string;
    dec_cont_stat_nom: string;
    geo_shape: string;
    geo_point_2d: string;
  }>;

  console.log(`Found ${rows.length} zones. Importing…`);

  // Truncate before re-import to allow idempotent re-runs
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

    // geo_shape may contain MultiPolygon; we cast to geometry to handle both
    await prisma.$executeRaw`
      INSERT INTO street_parking_zone (id, name, zone_color, hourly_fare, geometry)
      VALUES (
        ${row.dec_cont_stat_id},
        ${row.dec_cont_stat_nom},
        ${color},
        ${FARE_BY_COLOR[color]},
        ST_GeomFromGeoJSON(${row.geo_shape})
      )
    `;
    imported++;
  }

  console.log(`Done. ${imported} imported, ${skipped} skipped.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
