import "dotenv/config";
import { createReadStream, existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Fichier PBF préparé par scripts/prepare-osm-extract.sh
const PBF_PATH = resolve(process.cwd(), "docker/osm/grenoble.osm.pbf");

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

// --- Types PBF ---

type OsmTags = Record<string, string>;

type PbfNode     = { type: "node";     id: number; lat: number; lon: number; tags: OsmTags };
type PbfWay      = { type: "way";      id: number; refs: number[];           tags: OsmTags };
type PbfMember   = { id: number; type: string; role: string };
type PbfRelation = { type: "relation"; id: number; refs: PbfMember[];        tags: OsmTags };
type PbfElement  = PbfNode | PbfWay | PbfRelation;

type Geometry    = { lat: number; lng: number; footprintGeoJson: string | null };
type MatchRow    = { id: string; name: string; dist: number };

// --- Lecture du PBF ---

async function loadPbfElements(path: string): Promise<PbfElement[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const OsmPbfParser = require("osm-pbf-parser");
  return new Promise((res, rej) => {
    const elements: PbfElement[] = [];
    const parser = new OsmPbfParser();
    createReadStream(path)
      .pipe(parser)
      .on("data", (items: PbfElement[]) => elements.push(...items))
      .on("end", () => res(elements))
      .on("error", rej);
  });
}

// --- Géométrie ---

function closeRing(coords: [number, number][]): [number, number][] {
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) return [...coords, first];
  return coords;
}

function computeCentroid(coords: [number, number][]): [number, number] {
  const ring = coords[0] === coords[coords.length - 1] ? coords.slice(0, -1) : coords;
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  return [lng, lat];
}

/** Shoelace + correction cos(lat) → m² approximatif (précis à ~2% sur Grenoble). */
function polygonAreaM2(coords: [number, number][]): number {
  const ring = coords[0] === coords[coords.length - 1] ? coords.slice(0, -1) : coords;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  const latRad = (ring.reduce((s, c) => s + c[1], 0) / ring.length) * (Math.PI / 180);
  return (Math.abs(area) / 2) * 111_320 ** 2 * Math.cos(latRad);
}

function resolveGeometry(el: PbfElement, wayGeomMap: Map<number, [number, number][]>): Geometry | null {
  if (el.type === "node") {
    return { lat: el.lat, lng: el.lon, footprintGeoJson: null };
  }

  if (el.type === "way") {
    const coords = wayGeomMap.get(el.id);
    if (!coords || coords.length < 3) return null;
    const ring = closeRing(coords);
    const [lng, lat] = computeCentroid(ring);
    return { lat, lng, footprintGeoJson: JSON.stringify({ type: "Polygon", coordinates: [ring] }) };
  }

  // relation → outer rings
  const outerRings = (el.refs ?? [])
    .filter((m) => m.role === "outer" && m.type === "way")
    .map((m) => wayGeomMap.get(m.id))
    .filter((c): c is [number, number][] => c !== undefined && c.length >= 3)
    .map(closeRing);

  if (outerRings.length === 0) return null;

  const [lng, lat] = computeCentroid(outerRings[0]);
  const footprintGeoJson = outerRings.length === 1
    ? JSON.stringify({ type: "Polygon", coordinates: outerRings })
    : JSON.stringify({ type: "MultiPolygon", coordinates: outerRings.map((r) => [r]) });
  return { lat, lng, footprintGeoJson };
}

// --- Logique métier ---

function mapTags(tags: OsmTags = {}) {
  const name = tags["name"] ?? tags["brand"] ?? tags["operator"] ?? "Parking";
  const free = tags["fee"] === "no" || tags["access"] === "customers" || tags["access"] === "free";
  const maxHeight = tags["maxheight"] ? parseFloat(tags["maxheight"]) || null : null;
  const address = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");

  return {
    name,
    operator:         tags["operator"] ?? null,
    free,
    total_capacity:   parseInt(tags["capacity"] ?? "0", 10) || 0,
    disabled_spaces:  parseInt(tags["capacity:disabled"] ?? "0", 10) || 0,
    ev_chargers:      parseInt(tags["capacity:charging"] ?? "0", 10) || 0,
    bike_spaces:      0,
    max_height:       maxHeight,
    facility_type:    tags["parking"] ?? "surface",
    address,
    city:             tags["addr:city"] ?? "",
    insee_code:       "38185",
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

function isParkingUseful(tags: OsmTags, estimatedCapacity = 0): boolean {
  const parkingType = tags["parking"];
  if (parkingType && EXCLUDED_PARKING_TYPES.has(parkingType)) return false;

  const access = tags["access"];
  if (access === "private" || access === "no" || access === "permit" || access === "employees" || access === "restricted") return false;
  if (tags["disused"] === "yes" || tags["disused:amenity"] === "parking") return false;
  if (access === "customers") return true;

  const name = tags["name"] ?? tags["brand"] ?? "";
  const hasSpecificName = name.length > 0 && name.toLowerCase() !== "parking";
  const hasOperator = Boolean(tags["operator"]);
  const tagCapacity = parseInt(tags["capacity"] ?? "0", 10) || 0;
  const effectiveCapacity = tagCapacity > 0 ? tagCapacity : estimatedCapacity;

  return hasSpecificName || hasOperator || effectiveCapacity >= 10;
}

// --- Requêtes DB ---

async function mergeLaMetro(prisma: PrismaClient, matchId: string, osmId: bigint, footprintGeoJson: string | null) {
  if (footprintGeoJson) {
    await prisma.$executeRaw`
      UPDATE parking
      SET source    = 'merged',
          osm_id    = ${osmId},
          footprint = ST_GeomFromGeoJSON(${footprintGeoJson}),
          updated_at = NOW()
      WHERE id = ${matchId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE parking
      SET source    = 'merged',
          osm_id    = ${osmId},
          updated_at = NOW()
      WHERE id = ${matchId}
    `;
  }
}

async function insertOsm(
  prisma: PrismaClient,
  osmId: string,
  mapped: ReturnType<typeof mapTags>,
  osmBigInt: bigint,
  lat: number,
  lng: number,
  footprintGeoJson: string | null,
) {
  if (footprintGeoJson) {
    await prisma.$executeRaw`
      INSERT INTO parking (
        id, name, address, city, insee_code, facility_type, free,
        total_capacity, disabled_spaces, ev_chargers, bike_spaces,
        max_height, operator, source, osm_id, updated_at, position, footprint
      ) VALUES (
        ${osmId}, ${mapped.name}, ${mapped.address}, ${mapped.city},
        ${mapped.insee_code}, ${mapped.facility_type}, ${mapped.free},
        ${mapped.total_capacity}, ${mapped.disabled_spaces}, ${mapped.ev_chargers},
        ${mapped.bike_spaces}, ${mapped.max_height}, ${mapped.operator},
        'osm', ${osmBigInt}, NOW(),
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
        ${osmId}, ${mapped.name}, ${mapped.address}, ${mapped.city},
        ${mapped.insee_code}, ${mapped.facility_type}, ${mapped.free},
        ${mapped.total_capacity}, ${mapped.disabled_spaces}, ${mapped.ev_chargers},
        ${mapped.bike_spaces}, ${mapped.max_height}, ${mapped.operator},
        'osm', ${osmBigInt}, NOW(),
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )
    `;
  }
}

// --- Main ---

async function main() {
  if (!existsSync(PBF_PATH)) {
    throw new Error(
      `Fichier PBF introuvable : ${PBF_PATH}\n` +
      `Exécutez d'abord : bash scripts/prepare-osm-extract.sh`
    );
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log(`Lecture de ${PBF_PATH}…`);
  const allElements = await loadPbfElements(PBF_PATH);
  console.log(`${allElements.length} éléments OSM chargés.`);

  // Index des coordonnées de chaque nœud
  const nodeMap = new Map<number, [number, number]>();
  for (const el of allElements) {
    if (el.type === "node") nodeMap.set(el.id, [el.lon, el.lat]);
  }

  // Index des géométries de chaque way
  const wayGeomMap = new Map<number, [number, number][]>();
  for (const el of allElements) {
    if (el.type === "way") {
      const coords = el.refs
        .map((id) => nodeMap.get(id))
        .filter((c): c is [number, number] => c !== undefined);
      if (coords.length >= 3) wayGeomMap.set(el.id, coords);
    }
  }

  // Filtrer les éléments parking utiles
  const parkingElements = allElements.filter((el) => {
    if (el.tags?.["amenity"] !== "parking") return false;

    let estimatedCapacity = 0;
    if (el.type === "way") {
      const coords = wayGeomMap.get(el.id);
      if (coords) estimatedCapacity = Math.round(polygonAreaM2(closeRing(coords)) / 25);
    } else if (el.type === "relation") {
      const outerCoords = (el.refs ?? [])
        .filter((m) => m.role === "outer" && m.type === "way")
        .map((m) => wayGeomMap.get(m.id))
        .find((c): c is [number, number][] => c !== undefined && c.length >= 3);
      if (outerCoords) estimatedCapacity = Math.round(polygonAreaM2(closeRing(outerCoords)) / 25);
    }

    return isParkingUseful(el.tags ?? {}, estimatedCapacity);
  });
  console.log(`${parkingElements.length} éléments amenity=parking à traiter.`);

  // Idempotence : reset de l'import précédent
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

  for (const el of parkingElements) {
    const geom = resolveGeometry(el, wayGeomMap);
    if (!geom) { skipped++; continue; }

    const { lat, lng, footprintGeoJson } = geom;
    const mapped = mapTags(el.tags ?? {});
    const osmBigInt = BigInt(el.id);

    // Chercher un parking LaMetro à ≤150m à fusionner
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

    const match = candidates.find(
      (c) => Number(c.dist) <= 50 || namesOverlap(mapped.name, c.name)
    );

    if (match) {
      await mergeLaMetro(prisma, match.id, osmBigInt, footprintGeoJson);
      merged++;
    } else {
      await insertOsm(prisma, `osm:${el.type}/${el.id}`, mapped, osmBigInt, lat, lng, footprintGeoJson);
      inserted++;
    }
  }

  // Calculer la capacité estimée depuis l'emprise (~25 m²/place)
  await prisma.$executeRaw`
    UPDATE parking
    SET estimated_capacity = GREATEST(1, ROUND(ST_Area(ST_Transform(footprint, 2154)) / 25)::int)
    WHERE footprint IS NOT NULL
  `;
  console.log("Capacités estimées calculées.");

  console.log(
    `Done. ${merged} LaMetro parkings enrichis, ${inserted} OSM insérés, ${skipped} ignorés.`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
