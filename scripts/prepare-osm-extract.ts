import "dotenv/config";
import { prepareOsmExtract } from "../lib/imports/prepareOsmExtract";

prepareOsmExtract().catch((err) => {
  console.error(err);
  process.exit(1);
});
