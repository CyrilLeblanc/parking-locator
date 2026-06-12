import { prisma } from "../prisma";

// --- Types Overpass ---

type OsmTags = Record<string, string>;

interface OverpassNode {
  type: "node";
  id: number;
  lat: number;
  lon: number;
  tags: OsmTags;
}

interface OverpassWay {
  type: "way";
  id: number;
  nodes: number[];
  geometry: { lat: number; lon: number }[];
  tags: OsmTags;
}

interface OverpassMember {
  type: string;
  ref: number;
  role: string;
  geometry?: { lat: number; lon: number }[];
}

interface OverpassRelation {
  type: "relation";
  id: number;
  members: OverpassMember[];
  tags: OsmTags;
}

type OverpassElement = OverpassNode | OverpassWay | OverpassRelation;

// --- Constantes ---

const OVERPASS_URL = "https://overpass.cyrleb.dev/api/interpreter";
const BBOX = "45.05,5.60,45.30,5.85";

// --- Requête Overpass ---

interface OverpassResponse {
  version: number;
  elements: OverpassElement[];
}

async function fetchOsmParkings(): Promise<OverpassElement[]> {
  const query = `[out:json][bbox:${BBOX}];\n(\n  node[amenity=parking];\n  way[amenity=parking];\n  relation[amenity=parking];\n);\nout geom;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

  const data: OverpassResponse = await res.json();
  return data.elements;
}

// --- Géométrie ---

function osmCoordToPair(c: { lat: number; lon: number }): [number, number] {
  return [c.lon, c.lat];
}

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

function resolveGeometry(el: OverpassElement): { lat: number; lng: number; footprintGeoJson: string | null } | null {
  if (el.type === "node") {
    return { lat: el.lat, lng: el.lon, footprintGeoJson: null };
  }

  if (el.type === "way") {
    if (!el.geometry || el.geometry.length < 3) return null;
    const coords = el.geometry.map(osmCoordToPair);
    const ring = closeRing(coords);
    const [lng, lat] = computeCentroid(ring);
    return { lat, lng, footprintGeoJson: JSON.stringify({ type: "Polygon", coordinates: [ring] }) };
  }

  const outerRings = (el.members ?? [])
    .filter((m) => m.role === "outer" && m.type === "way")
    .map((m) => m.geometry?.map(osmCoordToPair))
    .filter((c): c is [number, number][] => c !== undefined && c.length >= 3)
    .map(closeRing);

  if (outerRings.length === 0) return null;

  const [lng, lat] = computeCentroid(outerRings[0]);
  const footprintGeoJson =
    outerRings.length === 1
      ? JSON.stringify({ type: "Polygon", coordinates: outerRings })
      : JSON.stringify({ type: "MultiPolygon", coordinates: outerRings.map((r) => [r]) });
  return { lat, lng, footprintGeoJson };
}

// --- Logique métier ---

const EXCLUDED_PARKING_TYPES = new Set([
  "street_side", "lane", "on_kerb", "half_on_kerb",
  "garage_boxes", "carports", "sheds", "layby",
]);

function mapTags(tags: OsmTags = {}) {
  const name = tags["name"] ?? tags["brand"] ?? tags["operator"] ?? "Parking";
  const free = tags["fee"] === "no" || tags["access"] === "customers" || tags["access"] === "free";
  const maxHeight = tags["maxheight"] ? parseFloat(tags["maxheight"]) || null : null;
  const address = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");

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
    address,
    city: tags["addr:city"] ?? "",
    insee_code: "38185",
  };
}

const NAME_STOP_WORDS = new Set(["parking", "parc", "park", "de", "du", "des", "les", "la", "le", "et"]);

function nameWords(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
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
  if (
    access === "private" || access === "no" || access === "permit" ||
    access === "employees" || access === "restricted"
  ) return false;
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

type MatchRow = { id: string; name: string; dist: number };

async function mergeLaMetro(matchId: string, osmId: bigint, footprintGeoJson: string | null) {
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

export async function importOsmParkings(): Promise<void> {
  console.log("Récupération des parkings OSM via Overpass…");
  const elements = await fetchOsmParkings();
  console.log(`${elements.length} éléments amenity=parking reçus.`);

  const parkingElements = elements.filter((el) => {
    let estimatedCapacity = 0;
    if (el.type === "way" && el.geometry) {
      estimatedCapacity = Math.round(polygonAreaM2(closeRing(el.geometry.map(osmCoordToPair))) / 25);
    } else if (el.type === "relation") {
      const outer = (el.members ?? [])
        .filter((m) => m.role === "outer" && m.type === "way")
        .map((m) => m.geometry?.map(osmCoordToPair))
        .find((c): c is [number, number][] => c !== undefined && c.length >= 3);
      if (outer) estimatedCapacity = Math.round(polygonAreaM2(closeRing(outer)) / 25);
    }
    return isParkingUseful(el.tags ?? {}, estimatedCapacity);
  });
  console.log(`${parkingElements.length} parkings à traiter.`);

  console.log("Reset des imports précédents…");
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
    const geom = resolveGeometry(el);
    if (!geom) { skipped++; continue; }

    const { lat, lng, footprintGeoJson } = geom;
    const mapped = mapTags(el.tags ?? {});
    const osmBigInt = BigInt(el.id);

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
      (c: MatchRow) => Number(c.dist) <= 50 || namesOverlap(mapped.name, c.name)
    );

    if (match) {
      await mergeLaMetro(match.id, osmBigInt, footprintGeoJson);
      merged++;
    } else {
      await insertOsm(`osm:${el.type}/${el.id}`, mapped, osmBigInt, lat, lng, footprintGeoJson);
      inserted++;
    }
  }

  await prisma.$executeRaw`
    UPDATE parking
    SET estimated_capacity = GREATEST(1, ROUND(ST_Area(ST_Transform(footprint, 2154)) / 25)::int)
    WHERE footprint IS NOT NULL
  `;

  console.log(`Terminé. ${merged} LaMetro enrichis, ${inserted} OSM insérés, ${skipped} ignorés.`);
}
