import "dotenv/config";
import { importZones } from "../lib/imports/zones";

importZones().catch((err) => {
  console.error(err);
  process.exit(1);
});
