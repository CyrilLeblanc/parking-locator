import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
// Bounding box : sud,ouest,nord,est — Grenoble + couronne
const BBOX = "45.05,5.60,45.30,5.85";

// Exclure dès la requête : accès privé, résidentiel, permis seulement
const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  node["amenity"="parking"]["access"!="private"]["access"!="residents"]["access"!="permit"](${BBOX});
  way["amenity"="parking"]["access"!="private"]["access"!="residents"]["access"!="permit"](${BBOX});
);
out body;
>;
out skel qt;
`;

// Types de stationnement non pertinents pour un conducteur (voirie, boxs privés…)
const EXCLUDED_PARKING_TYPES = new Set([
  "street_side",
  "lane",
  "on_kerb",
  "half_on_kerb",
  "garage_boxes",
  "carports",
  "sheds",
  "layby",
]);

type OsmTags = Record<string, string>;

type OsmElement =
  | { type: "node"; id: number; lat: number; lon: number; tags?: OsmTags }
  | { type: "way"; id: number; nodes: number[]; tags?: OsmTags }
  | { type: "relation"; id: number; tags?: OsmTags };

type OverpassResponse = { elements: OsmElement[] };

function mapTags(tags: OsmTags = {}) {
  const name =
    tags["name"] ?? tags["brand"] ?? tags["operator"] ?? "Parking";
  const free =
    tags["fee"] === "no" || tags["access"] === "customers" || tags["access"] === "free";
  const maxHeight = tags["maxheight"] ? parseFloat(tags["maxheight"]) || null : null;
  const addressParts = [tags["addr:housenumber"], tags["addr:street"]]
    .filter(Boolean)
    .join(" ");

  return {
    name,
    operator: tags["operator"] ?? null,
    free,
    total_capacity: parseInt(tags["capacity"] ?? "0", 10) || 0,
    disabled_spaces: parseInt(tags["capacity:disabled"] ?? "0", 10) || 0,
    ev_chargers: parseInt(tags["capacity:charging"] ?? "0", 10) || 0,
    bike_spaces: 0,
    max_height: maxHeight,
    facility_type: tags["parking"] ?? "surface",
    address: addressParts,
    city: tags["addr:city"] ?? "",
    insee_code: "38185",
  };
}

const NAME_STOP_WORDS = new Set(["parking", "parc", "park", "de", "du", "des", "les", "la", "le", "et"]);

function nameWords(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !NAME_STOP_WORDS.has(w))
  );
}

function namesOverlap(a: string, b: string): boolean {
  const wa = nameWords(a);
  const wb = nameWords(b);
  for (const w of wa) if (wb.has(w)) return true;
  return false;
}

function computeCentroid(coords: [number, number][]): [number, number] {
  // coords sont [lng, lat], exclure le doublon de fermeture
  const ring = coords[0] === coords[coords.length - 1] ? coords.slice(0, -1) : coords;
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  return [lng, lat];
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching OSM parking data from Overpass API…");
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });
  if (!res.ok) throw new Error(`Overpass API HTTP ${res.status}`);

  const data: OverpassResponse = await res.json();
  const elements = data.elements;
  console.log(`Received ${elements.length} OSM elements.`);

  // Build lookup nodeId → [lng, lat]
  const nodeMap = new Map<number, [number, number]>();
  for (const el of elements) {
    if (el.type === "node") {
      nodeMap.set(el.id, [el.lon, el.lat]);
    }
  }

  // --- Idempotence : reset merged → laMetro, supprimer osm ---
  console.log("Resetting previous import…");
  await prisma.$executeRaw`
    UPDATE parking
    SET source = 'laMetro', osm_id = NULL, footprint = NULL, updated_at = NOW()
    WHERE source = 'merged'
  `;
  await prisma.$executeRaw`DELETE FROM parking WHERE source = 'osm'`;

  let merged = 0;
  let inserted = 0;
  let skipped = 0;

  // Filtrer : garder uniquement les éléments amenity=parking avec un type utile et identifiables
  // (les noeuds sans tags sont les noeuds squelette retournés par >;)
  const parkingElements = elements.filter((el) => {
    if (el.type === "relation") return false;
    if (el.tags?.["amenity"] !== "parking") return false;

    const tags = el.tags ?? {};
    const parkingType = tags["parking"];
    if (parkingType && EXCLUDED_PARKING_TYPES.has(parkingType)) return false;

    // Garder uniquement les parkings identifiables :
    // un nom spécifique (pas juste "Parking"), un opérateur, ou une capacité ≥ 10
    const name = tags["name"] ?? tags["brand"] ?? "";
    const hasSpecificName = name.length > 0 && name.toLowerCase() !== "parking";
    const hasOperator = Boolean(tags["operator"]);
    const capacity = parseInt(tags["capacity"] ?? "0", 10) || 0;
    const hasCapacity = capacity >= 10;

    return hasSpecificName || hasOperator || hasCapacity;
  });
  console.log(`${parkingElements.length} éléments amenity=parking à traiter.`);

  for (const el of parkingElements) {
    if (el.type === "relation") continue; // guard — déjà filtré

    let lng: number;
    let lat: number;
    let footprintGeoJson: string | null = null;

    if (el.type === "node") {
      lng = el.lon;
      lat = el.lat;
      // nodes = pas de polygone
    } else {
      // way → reconstruire le polygone
      const coords: [number, number][] = el.nodes
        .map((nid) => nodeMap.get(nid))
        .filter((c): c is [number, number] => c !== undefined);

      if (coords.length < 3) {
        skipped++;
        continue;
      }

      // Fermer l'anneau si nécessaire
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push(first);
      }

      const [cLng, cLat] = computeCentroid(coords);
      lng = cLng;
      lat = cLat;
      footprintGeoJson = JSON.stringify({
        type: "Polygon",
        coordinates: [coords],
      });
    }

    const tags = el.tags ?? {};
    const mapped = mapTags(tags);

    // Chercher les parkings LaMetro à ≤150m avec leur distance et nom
    type MatchRow = { id: string; name: string; dist: number };
    const candidates = await prisma.$queryRaw<MatchRow[]>`
      SELECT id, name,
        ST_Distance(
          position::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS dist
      FROM parking
      WHERE source = 'laMetro'
        AND ST_DWithin(
          position::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          150
        )
      ORDER BY dist
    `;

    // Règle de merge :
    // - dist ≤ 50m → toujours merger (très proche, pas besoin de nom)
    // - dist ≤ 150m → merger uniquement si les noms partagent un mot significatif
    const osmName = mapped.name;
    const match = candidates.find(
      (c) => Number(c.dist) <= 50 || namesOverlap(osmName, c.name)
    );

    if (match) {
      // Merge : on enrichit le parking LaMetro avec les données OSM
      const matchId = match.id;
      if (footprintGeoJson) {
        await prisma.$executeRaw`
          UPDATE parking
          SET source    = 'merged',
              osm_id    = ${BigInt(el.id)},
              footprint = ST_GeomFromGeoJSON(${footprintGeoJson}),
              updated_at = NOW()
          WHERE id = ${matchId}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE parking
          SET source    = 'merged',
              osm_id    = ${BigInt(el.id)},
              updated_at = NOW()
          WHERE id = ${matchId}
        `;
      }
      merged++;
    } else {
      // Nouveau parking OSM-only
      const osmId = `osm:${el.type}/${el.id}`;

      if (footprintGeoJson) {
        await prisma.$executeRaw`
          INSERT INTO parking (
            id, name, address, city, insee_code, facility_type, free,
            total_capacity, disabled_spaces, ev_chargers, bike_spaces,
            max_height, operator, source, osm_id, updated_at, position, footprint
          ) VALUES (
            ${osmId},
            ${mapped.name},
            ${mapped.address},
            ${mapped.city},
            ${mapped.insee_code},
            ${mapped.facility_type},
            ${mapped.free},
            ${mapped.total_capacity},
            ${mapped.disabled_spaces},
            ${mapped.ev_chargers},
            ${mapped.bike_spaces},
            ${mapped.max_height},
            ${mapped.operator},
            'osm',
            ${BigInt(el.id)},
            NOW(),
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
            ST_GeomFromGeoJSON(${footprintGeoJson})
          )
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO parking (
            id, name, address, city, insee_code, facility_type, free,
            total_capacity, disabled_spaces, ev_chargers, bike_spaces,
            max_height, operator, source, osm_id, updated_at, position
          ) VALUES (
            ${osmId},
            ${mapped.name},
            ${mapped.address},
            ${mapped.city},
            ${mapped.insee_code},
            ${mapped.facility_type},
            ${mapped.free},
            ${mapped.total_capacity},
            ${mapped.disabled_spaces},
            ${mapped.ev_chargers},
            ${mapped.bike_spaces},
            ${mapped.max_height},
            ${mapped.operator},
            'osm',
            ${BigInt(el.id)},
            NOW(),
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
          )
        `;
      }
      inserted++;
    }
  }

  console.log(
    `Done. ${merged} LaMetro parkings enrichis (merged), ${inserted} parkings OSM insérés, ${skipped} ignorés (géométrie invalide).`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
