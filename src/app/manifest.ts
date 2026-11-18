import type { MetadataRoute } from "next";

/** Home-screen / installed-app icon set (Android, Chrome). Icons are rebuilt by scripts/brand-images/build.py. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CRI — Research Programs",
    short_name: "CRI",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#2563EB",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
