import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDictionary, getLocale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, eventJsonLd } from "@/lib/structured-data";
import { WEBINAR, webinarRegistrationOpen } from "@/lib/webinar";
import WebinarClient from "./WebinarClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale()).webinar.meta;
  return pageMetadata({ title: t.title, description: t.description, path: "/webinar", type: "website" });
}

/** Public sign-up page for the current webinar; the form closes itself once the session has started. */
export default async function WebinarPage() {
  const [locale, session] = await Promise.all([getLocale(), getServerSession(authOptions)]);
  const t = getDictionary(locale);
  const open = webinarRegistrationOpen();
  const user = session?.user ? { name: session.user.name ?? "", email: session.user.email ?? "", role: session.user.role === "PARENT" ? "PARENT" : session.user.role === "STUDENT" ? "STUDENT" : "" } : null;
  return (
    <>
      <JsonLd data={[eventJsonLd(locale, { name: t.webinar.meta.title.replace(/ \| CRI$/, ""), description: t.webinar.meta.description, startDate: WEBINAR.startsAt, durationMinutes: WEBINAR.durationMinutes, path: "/webinar" }), breadcrumbJsonLd(locale, [[t.nav.research, "/research"], [t.webinar.eyebrow, "/webinar"]])]} />
      <WebinarClient open={open} user={user} />
    </>
  );
}
