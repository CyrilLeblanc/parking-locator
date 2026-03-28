import "dotenv/config";
import { importParkings } from "../lib/imports/parkings";

importParkings().catch((err) => {
  console.error(err);
  process.exit(1);
});
