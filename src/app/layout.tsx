import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppProvider from "@/components/layout/AppProvider";
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRI | Premium Research Programs for Students",
  description: "CRI offers exceptional research programs for ambitious students, guided by Ivy League and top-tier university professors. Transform your curiosity into accepted publications.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AppProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
