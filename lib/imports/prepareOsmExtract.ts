import { createWriteStream, mkdirSync, statSync, unlinkSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const SOURCE_URL = "https://download.geofabrik.de/europe/france/rhone-alpes-latest.osm.pbf";
const BBOX = "5.60,45.05,5.85,45.30"; // ouest,sud,est,nord
const TMP_FILE = "/tmp/rhone-alpes.osm.pbf";

export async function prepareOsmExtract(): Promise<void> {
  const osmiumCheck = spawnSync("osmium", ["--version"], { stdio: "pipe" });
  if (osmiumCheck.status !== 0) {
    throw new Error(
      "osmium-tool non trouvé.\n" +
      "  Ubuntu/Debian : sudo apt install osmium-tool\n" +
      "  macOS         : brew install osmium-tool"
    );
  }

  const outDir = resolve(process.cwd(), "docker/osm");
  const outFile = resolve(outDir, "grenoble.osm.pbf");

  mkdirSync(outDir, { recursive: true });

  console.log("Téléchargement de Rhône-Alpes (~500 MB)…");
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(
    Readable.fromWeb(res.body as import("stream/web").ReadableStream),
    createWriteStream(TMP_FILE)
  );

  console.log(`Découpe bbox ${BBOX}…`);
  const result = spawnSync("osmium", ["extract", "--bbox", BBOX, TMP_FILE, "-o", outFile, "--overwrite"], {
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`osmium exited with ${result.status}`);

  unlinkSync(TMP_FILE);

  const sizeMb = (statSync(outFile).size / 1024 / 1024).toFixed(1);
  console.log(`Extrait prêt : ${outFile} (${sizeMb} MB)`);
}
