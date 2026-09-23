import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary, getLocale } from "@/i18n";

// /contact/page.tsx is a client component, so its metadata lives in this segment layout.
export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  const base = pageMetadata({ ...t.system.meta.contact, path: "/contact" });
  return { ...base, openGraph: { ...base.openGraph, locale: t.system.site.ogLocale } };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
