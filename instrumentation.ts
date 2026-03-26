import { COLLECT_INTERVAL_MS } from "@/lib/constants";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { collectHistory } = await import("./lib/collectHistory");

  const run = () =>
    collectHistory().catch((err) =>
      console.error("[collect-history] Error:", err)
    );

  run();
  setInterval(run, COLLECT_INTERVAL_MS);
}
