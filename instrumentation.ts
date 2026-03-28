declare global {
  var __collectHistoryCron: import("croner").Cron | undefined;
  var __osmUpdateCron: import("croner").Cron | undefined;
  var __weeklyImportCron: import("croner").Cron | undefined;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { Cron } = await import("croner");
  const { collectHistory } = await import("./lib/collectHistory");
  const { prepareOsmExtract, importOsmParkings } = await import("./lib/imports/osmParkings");
  const { importParkings } = await import("./lib/imports/parkings");
  const { importFares } = await import("./lib/imports/fares");
  const { importZones } = await import("./lib/imports/zones");

  // Collecte d'historique toutes les 5 min
  globalThis.__collectHistoryCron?.stop();
  globalThis.__collectHistoryCron = new Cron(
    "*/5 * * * *",
    { protect: true },
    async () => {
      try {
        await collectHistory();
      } catch (err) {
        console.error("[collect-history] Error:", err);
      }
    }
  );

  // Mise à jour OSM chaque jour à 3h
  globalThis.__osmUpdateCron?.stop();
  globalThis.__osmUpdateCron = new Cron(
    "0 3 * * *",
    { protect: true },
    async () => {
      try {
        console.log("[osm-update] Starting…");
        await prepareOsmExtract();
        await importOsmParkings();
        console.log("[osm-update] Done.");
      } catch (err) {
        console.error("[osm-update] Error:", err);
      }
    }
  );

  // Import complet chaque dimanche à 4h
  globalThis.__weeklyImportCron?.stop();
  globalThis.__weeklyImportCron = new Cron(
    "0 4 * * 0",
    { protect: true },
    async () => {
      try {
        console.log("[weekly-import] Starting…");
        await importParkings();
        await importFares();
        await importZones();
        console.log("[weekly-import] Done.");
      } catch (err) {
        console.error("[weekly-import] Error:", err);
      }
    }
  );
}
