import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // criglobal.org is the canonical host. The old Vercel production aliases keep working only as
    // permanent redirects, so sessions, OAuth callbacks and shared links all live on one domain.
    // Preview deployments (cri-portal-git-*, cri-portal-<hash>-*) are not matched.
    return ["cri-portal-2024.vercel.app", "cri-portal.vercel.app"].map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: "https://criglobal.org/:path*",
      permanent: true,
    }));
  },
  // next dev otherwise appends generated agent rules to CLAUDE.md / AGENTS.md on every start.
  agentRules: false,
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
      {
        protocol: 'https',
        hostname: 'postfiles.pstatic.net',
        pathname: '/**',
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
