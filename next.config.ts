import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['googleapis', 'xlsx'],
  images: {
    qualities: [60, 75],
    remotePatterns: [
      { protocol: "https", hostname: "www.societyforscience.org", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "conrad.spacecenter.org", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "static.igem.org", pathname: "/websites/**" },
      { protocol: "https", hostname: "diamondchallenge.org", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "geniusolympiad.org", pathname: "/assets/img/**" },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
};

export default nextConfig;
