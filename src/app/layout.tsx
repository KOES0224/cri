import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import AppProvider from "@/components/layout/AppProvider";
import Navbar from "@/components/layout/Navbar";
import PublicOnly from "@/components/layout/PublicOnly";
import Footer from "@/components/layout/Footer";
import Analytics from "@/components/Analytics";
import { SITE_URL } from "@/lib/seo";
import { getLocale } from "@/i18n";
import { LocaleProvider } from "@/i18n/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Pages that export their own metadata override this with their own path.
  alternates: { canonical: "/" },
  title: "CRI | Premium Research Programs for Students",
  description: "CRI offers student-led research guided by university professors. Develop an original research question from your interests and write your own paper through in-person summer, online winter, or individual programs.",
  openGraph: {
    title: "CRI | Premium Research Programs",
    description: "Guided research programs with top university professors.",
    url: "https://criglobal.org",
    siteName: "CRI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CRI | Premium Research Programs",
    description: "Guided research programs with top university professors.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
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
        <Analytics />
      </body>
    </html>
  );
}
