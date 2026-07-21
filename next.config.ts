import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        // The generated service worker must never be cached by the browser, so
        // new versions are picked up promptly on the next load.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
