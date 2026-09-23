import type { NextConfig } from "next";

// Slugs of the hardcoded articles that shipped before the blog moved to the CMS database (#15), mapped to
// the article that now covers the same Naver post, so shared links and search results keep working.
const LEGACY_ARTICLES: [string, string][] = [
  ["/blog/from-interest-to-research-and-real-world-projects", "/blog/what-is-cri-research-to-projects-and-startups"],
  ["/blog/from-high-school-research-to-ieee-embs-poster-presentation", "/success/srp-teams-wearable-health-ieee-bsn-2025"],
  ["/blog/student-authored-psychology-research-published-in-ijhsr", "/success/oxford-psychology-tears-experiment-published-ijhsr"],
  ["/blog/a-hotel-housekeeping-question-becomes-an-economics-paper", "/success/hotel-linen-screening-economics-paper-nyu-early-decision"],
  ["/blog/ksef-gold-and-isef-qualification", "/blog/ksef-korea-science-fair-guide"],
  ["/blog/what-is-isef-a-guide-to-the-worlds-largest-high-school-science-fair", "/blog/regeneron-isef-guide"],
  ["/blog/why-write-a-research-paper", "/blog/paper-writing-guide-1-why-write-a-paper"],
  ["/blog/winter-online-research-program", "/blog/winter-online-research-program-2026"],
  ["/blog/research-continues-after-the-srp", "/blog/srp-extension-research-after-the-program"],
  ["/success/ksef-gold-and-isef-qualification", "/blog/ksef-korea-science-fair-guide"],
  ["/success/ieee-embs-poster-presentation", "/success/srp-teams-wearable-health-ieee-bsn-2025"],
  ["/success/psychology-research-published-in-ijhsr", "/success/oxford-psychology-tears-experiment-published-ijhsr"],
  ["/success/economics-research-and-nyu-early-admission", "/success/hotel-linen-screening-economics-paper-nyu-early-decision"],
];

const nextConfig: NextConfig = {
  async redirects() {
    // criglobal.org is the canonical host. The old Vercel production aliases keep working only as
    // permanent redirects, so sessions, OAuth callbacks and shared links all live on one domain.
    // Preview deployments (cri-portal-git-*, cri-portal-<hash>-*) are not matched.
    return [
      ...["cri-portal-2024.vercel.app", "cri-portal.vercel.app"].map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://criglobal.org/:path*",
        permanent: true,
      })),
      ...LEGACY_ARTICLES.map(([source, destination]) => ({ source, destination, permanent: true })),
    ];
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
