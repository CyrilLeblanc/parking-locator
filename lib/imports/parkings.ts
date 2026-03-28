import { prisma } from "../prisma";

const API_URL = "https://data.mobilites-m.fr/api/points/json?types=parking&epci=LaMetro";

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
    hauteur_max?: number | string;
    num_siret?: string;
    nb_voitures_electriques?: number;
    nb_2_rm?: number;
    nb_2r_el?: number;
    nb_autopartage?: number;
    nb_covoit?: number;
    url?: string;
    type_usagers?: string;
    info?: string;
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

export async function importParkings(): Promise<void> {
  console.log("Fetching parkings from LaMetro API…");
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const geojson = await res.json();
  const features: ParkingFeature[] = geojson.features;
  console.log(`Found ${features.length} parkings. Importing…`);

  let imported = 0;

  for (const f of features) {
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates;

    await prisma.$executeRaw`
      INSERT INTO parking (
        id, name, address, city, insee_code, facility_type, free,
        total_capacity, disabled_spaces, ev_chargers, bike_spaces,
        moto_spaces, moto_ev_spaces, carsharing_spaces, carpool_spaces,
        max_height, siret, info_url, users_type, info, updated_at, position
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
        ${p.nb_voitures_electriques ?? 0},
        ${p.nb_velo ?? 0},
        ${p.nb_2_rm ?? 0},
        ${p.nb_2r_el ?? 0},
        ${p.nb_autopartage ?? 0},
        ${p.nb_covoit ?? 0},
        ${parseFloat_(p.hauteur_max)},
        ${p.num_siret ?? null},
        ${p.url ?? null},
        ${p.type_usagers ?? null},
        ${p.info ?? null},
        NOW(),
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )
      ON CONFLICT (id) DO UPDATE SET
        name              = EXCLUDED.name,
        address           = EXCLUDED.address,
        city              = EXCLUDED.city,
        facility_type     = EXCLUDED.facility_type,
        free              = EXCLUDED.free,
        total_capacity    = EXCLUDED.total_capacity,
        disabled_spaces   = EXCLUDED.disabled_spaces,
        ev_chargers       = EXCLUDED.ev_chargers,
        bike_spaces       = EXCLUDED.bike_spaces,
        moto_spaces       = EXCLUDED.moto_spaces,
        moto_ev_spaces    = EXCLUDED.moto_ev_spaces,
        carsharing_spaces = EXCLUDED.carsharing_spaces,
        carpool_spaces    = EXCLUDED.carpool_spaces,
        max_height        = EXCLUDED.max_height,
        siret             = EXCLUDED.siret,
        info_url          = EXCLUDED.info_url,
        users_type        = EXCLUDED.users_type,
        info              = EXCLUDED.info,
        position          = EXCLUDED.position,
        updated_at        = NOW()
    `;
    imported++;
  }

  console.log(`Done. ${imported} parkings imported.`);
}
