import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDictionary, getLocale } from "@/i18n";
import { WEBINAR, webinarKakaoNoticesOpen } from "@/lib/webinar";
import { webinarPhoneTokenValid } from "@/lib/webinar-phone";
import WebinarPhoneForm from "../WebinarPhoneForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seminar reminder | CRI", robots: { index: false, follow: false } };

/** The link in the confirmation and follow-up emails: add a mobile number to one sign-up for the KakaoTalk notices. */
export default async function WebinarPhonePage({ searchParams }: { searchParams: Promise<{ r?: string; t?: string }> }) {
  const { r = "", t: token = "" } = await searchParams;
  const valid = webinarPhoneTokenValid(r, token);
  const row = valid ? await prisma.webinarRegistration.findUnique({ where: { id: r }, select: { webinarKey: true, phone: true } }) : null;
  const t = getDictionary(await getLocale()).webinar.phoneAsk;
  const usable = Boolean(row && row.webinarKey === WEBINAR.key);
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 pb-24 pt-32">
      <div className="mx-auto max-w-lg">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-700">{t.pageEyebrow}</p>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">{t.pageTitle}</h1>
        <div className="mt-6">
          {!usable ? <p className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-700">{t.badLink}</p>
            : !webinarKakaoNoticesOpen() ? <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="font-bold text-gray-900">{t.closedTitle}</p><p className="mt-1.5 text-sm leading-relaxed text-gray-700">{t.closedBody}</p></div>
            : <WebinarPhoneForm id={r} token={token} place="link" />}
        </div>
        {usable && webinarKakaoNoticesOpen() && row?.phone && <p className="mt-3 text-sm text-gray-500">{t.alreadyHasPhone}</p>}
      </div>
    </div>
  );
}
