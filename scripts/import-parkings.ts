import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const API_URL =
  "https://data.mobilites-m.fr/api/points/json?types=parking&epci=LaMetro";

type ParkingFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    id: string;
    nom: string;
    adresse: string;
    commune: string;
    insee: string;
    type_ouvrage: string;
    gratuit: boolean | number | string;
    nb_places: number;
    nb_pmr: number;
    nb_velo: number;
    nb_pr?: number;
    hauteur_max?: number;
    num_siret?: string;
  };
};

function parseFloat_(value: number | string | undefined): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

function parseBool(value: boolean | number | string | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") return value.toLowerCase() === "oui" || value === "1";
  return false;
}

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching parkings from LaMetro API…");
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const geojson = await res.json();
  const features: ParkingFeature[] = geojson.features;
  console.log(`Found ${features.length} parkings. Importing…`);

  await prisma.$executeRaw`TRUNCATE TABLE parking CASCADE`;

  let imported = 0;

  for (const f of features) {
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates;

    await prisma.$executeRaw`
      INSERT INTO parking (
        id, name, address, city, insee_code, facility_type, free,
        total_capacity, disabled_spaces, ev_chargers, bike_spaces,
        max_height, siret, updated_at, position
      ) VALUES (
        ${p.id},
        ${p.nom ?? ""},
        ${p.adresse ?? ""},
        ${p.commune ?? ""},
        ${p.insee ?? ""},
        ${p.type_ouvrage ?? ""},
        ${parseBool(p.gratuit)},
        ${p.nb_places ?? 0},
        ${p.nb_pmr ?? 0},
        ${0},
        ${p.nb_velo ?? 0},
        ${parseFloat_(p.hauteur_max)},
        ${p.num_siret ?? null},
        NOW(),
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )
    `;
    imported++;
  }

  console.log(`Done. ${imported} parkings imported.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
