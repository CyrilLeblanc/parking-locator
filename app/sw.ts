/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, CacheableResponsePlugin, ExpirationPlugin, Serwist } from "serwist";

// Declares the injection point replaced by Serwist with the precache manifest at
// build time. This file is built by `serwist build` (esbuild) and excluded from
// the app's `tsc` run (see tsconfig.json `exclude`).
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const MOBILITES_TILES_ORIGIN = "https://data.mobilites-m.fr";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // MobiS map tiles are immutable (a given z/x/y never changes), so cache-first
    // is the right strategy. Bounded eviction keeps storage under control.
    {
      matcher: ({ url }) => url.origin === MOBILITES_TILES_ORIGIN,
      method: "GET",
      handler: new CacheFirst({
        cacheName: "mobilites-tiles",
        plugins: [
          // Status 0 = opaque cross-origin response: Leaflet loads tiles as
          // no-cors <img>, so the response has no readable status.
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 2000,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
