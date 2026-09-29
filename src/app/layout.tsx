import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import AppProvider from "@/components/layout/AppProvider";
import Navbar from "@/components/layout/Navbar";
import PublicOnly from "@/components/layout/PublicOnly";
import Footer from "@/components/layout/Footer";
import Analytics from "@/components/Analytics";
import { SITE_URL, localeMetadata } from "@/lib/seo";
import { JsonLd, organizationJsonLd } from "@/lib/structured-data";
import { getDictionary, getLocale, getPublicPath } from "@/i18n";
import { LocaleProvider } from "@/i18n/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hashed, normalizeEmail } from "@/lib/meta/normalize";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Search-console ownership tags, set per environment in Vercel (the value only, not the whole meta tag). */
const verification: Metadata["verification"] = {
  google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  other: Object.fromEntries(
    [
      ["naver-site-verification", process.env.NAVER_SITE_VERIFICATION],
      ["msvalidate.01", process.env.BING_SITE_VERIFICATION],
    ].filter((entry): entry is [string, string] => Boolean(entry[1])),
  ),
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const site = getDictionary(locale).system.site;
  // Default canonical/hreflang for the requested public page; pages with their own metadata override it.
  const path = await getPublicPath();
  const localized = path ? localeMetadata(path, locale) : null;
  return {
    metadataBase: new URL(SITE_URL),
    alternates: localized?.alternates,
    verification,
    title: site.title,
    description: site.description,
    openGraph: {
      title: site.ogTitle,
      description: site.ogDescription,
      siteName: "CRI",
      type: "website",
      url: SITE_URL,
      locale: site.ogLocale,
      ...localized?.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: site.ogTitle,
      description: site.ogDescription,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  // Signed-in visitors' email and user id go to the Meta pixel as advanced-matching keys, already SHA-256 hashed with
  // the same normalisation the Conversions API uses, so both channels report identical keys and no plain value is
  // rendered into the page. Read here so the pixel initialises immediately instead of waiting for a session fetch.
  const session = process.env.NEXT_PUBLIC_META_PIXEL_ID ? await getServerSession(authOptions).catch(() => null) : null;
  const matching = session?.user ? { em: hashed(normalizeEmail(session.user.email)), external_id: hashed(session.user.id?.trim() || undefined) } : undefined;
  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <LocaleProvider locale={locale}>
          <AppProvider>
            <PublicOnly><Navbar /></PublicOnly>
            <main className="flex-1">
              {children}
            </main>
            <PublicOnly><Footer /></PublicOnly>
          </AppProvider>
        </LocaleProvider>
        <JsonLd data={organizationJsonLd(locale, getDictionary(locale).system.site.description)} />
        <Analytics matching={matching} />
      </body>
    </html>
  );
}
