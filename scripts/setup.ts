import "dotenv/config";
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { prisma } from "../lib/prisma";
import { importParkings } from "../lib/imports/parkings";
import { importFares } from "../lib/imports/fares";
import { importZones } from "../lib/imports/zones";
import { importZoneFareBrackets } from "../lib/imports/zoneFareBrackets";
import { prepareOsmExtract, importOsmParkings, PBF_PATH } from "../lib/imports/osmParkings";

async function count(table: string, where?: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<[{ n: bigint }]>(
    `SELECT COUNT(*) AS n FROM ${table}${where ? ` WHERE ${where}` : ""}`
  );
  return Number(rows[0].n);
}

export async function setup(): Promise<void> {
  // 1. Migrations
  console.log("\n→ prisma migrate deploy");
  const result = spawnSync(
    "node",
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { stdio: "inherit" }
  );
  if (result.status !== 0) throw new Error("Migration failed");

  // 2. Zone fare brackets (données statiques, une seule fois)
  if ((await count("street_parking_fare_bracket")) === 0) {
    console.log("\n→ import-zone-fare-brackets");
    await importZoneFareBrackets();
  } else {
    console.log("✓ street_parking_fare_bracket déjà peuplé");
  }

  // 3. Zones de stationnement
  if ((await count("street_parking_zone")) === 0) {
    console.log("\n→ import-zones");
    await importZones();
  } else {
    console.log("✓ street_parking_zone déjà peuplé");
  }

  // 4. Parkings LaMetro + tarifs
  if ((await count("parking", "source = 'laMetro'")) === 0) {
    console.log("\n→ import-parkings");
    await importParkings();
    console.log("\n→ import-fares");
    await importFares();
  } else {
    console.log("✓ parkings LaMetro déjà importés");
  }

  // 5. OSM
  if (!existsSync(PBF_PATH)) {
    console.log("\n→ prepare-osm-extract");
    await prepareOsmExtract();
  } else {
    console.log("✓ fichier PBF déjà présent");
  }

  if ((await count("parking", "source IN ('osm', 'merged')")) === 0) {
    console.log("\n→ import-osm-parkings");
    await importOsmParkings();
  } else {
    console.log("✓ parkings OSM déjà importés");
  }

  console.log("\n✓ Setup terminé.");
}

// Permet d'exécuter le setup standalone : npx tsx scripts/setup.ts
if (require.main === module) {
  setup().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
