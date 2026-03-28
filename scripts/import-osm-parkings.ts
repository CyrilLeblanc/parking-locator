import "dotenv/config";
import { existsSync } from "fs";
import { prepareOsmExtract, importOsmParkings, PBF_PATH } from "../lib/imports/osmParkings";

async function main() {
  if (!existsSync(PBF_PATH)) {
    throw new Error(
      `Fichier PBF introuvable : ${PBF_PATH}\n` +
      `Exécutez d'abord : bash scripts/prepare-osm-extract.sh`
    );
  }
  await importOsmParkings();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export { prepareOsmExtract };
