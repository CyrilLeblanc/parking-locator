import "dotenv/config";
import { importZoneFareBrackets } from "../lib/imports/zoneFareBrackets";

importZoneFareBrackets().catch((err) => {
  console.error(err);
  process.exit(1);
});
