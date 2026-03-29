import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["osm-pbf-parser"],
};

export default nextConfig;
