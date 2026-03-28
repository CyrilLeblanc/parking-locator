declare global {
  // eslint-disable-next-line no-var
  var __collectHistoryCron: import("croner").Cron | undefined;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { Cron } = await import("croner");
  const { collectHistory } = await import("./lib/collectHistory");

  globalThis.__collectHistoryCron?.stop();

  globalThis.__collectHistoryCron = new Cron(
    "*/5 * * * *",
    { protect: true },
    async () => {
      try {
        console.log("[collect-history] Starting collection...");
        await collectHistory();
      } catch (err) {
        console.error("[collect-history] Error:", err);
      }
    }
  );
}
