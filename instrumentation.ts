const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { collectHistory } = await import("./lib/collectHistory");

  const run = () =>
    collectHistory().catch((err) =>
      console.error("[collect-history] Error:", err)
    );

  run();
  setInterval(run, INTERVAL_MS);
}
