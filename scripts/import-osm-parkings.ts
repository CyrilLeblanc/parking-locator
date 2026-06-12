import "dotenv/config";
import { importOsmParkings } from "../lib/imports/osmParkings";

async function main() {
  await importOsmParkings();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
