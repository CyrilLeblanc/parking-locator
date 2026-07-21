// @ts-check
import { spawnSync } from "node:child_process";
import { serwist } from "@serwist/next/config";

// A revision lets Serwist version the precached offline fallback, so an outdated
// cached response isn't reused after the page changes. `git rev-parse HEAD` is a
// cheap proxy; fall back to a constant when git isn't available.
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  "v1";

// Configurator mode: the service worker is built by an external `serwist build`
// step (run after `next build`), which keeps the integration bundler-agnostic and
// compatible with Next 16's Turbopack default.
export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
});
