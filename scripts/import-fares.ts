import "dotenv/config";
import { importFares } from "../lib/imports/fares";

importFares().catch((err) => {
  console.error(err);
  process.exit(1);
});
