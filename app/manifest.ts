import type { MetadataRoute } from "next";

// The theme/background color matches the dark map container background
// (`#3b373f` in app/globals.css) so the standalone splash blends with the map.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Parking Locator Grenoble",
    short_name: "Parking Locator",
    description:
      "Carte interactive des parkings et zones de stationnement à Grenoble",
    start_url: "/",
    display: "standalone",
    background_color: "#3b373f",
    theme_color: "#3b373f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
