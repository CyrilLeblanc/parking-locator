import "dotenv/config";
import { collectHistory } from "../lib/collectHistory";

collectHistory().catch((err) => {
  console.error(`[collect-history] Error:`, err);
  process.exit(1);
});
