import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getApplicationsSheetData } from "@/lib/admin-sheet";
import ApplicationsSheet from "./ApplicationsSheet";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Applications sheet | CRI Admin", robots: { index: false, follow: false } };

/** Full-screen spreadsheet of every application, outside the admin shell so the data gets the whole window. */
export default async function ApplicationsSheetPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=%2Fadmin%2Fapplications-sheet");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  const { rows, programs } = await getApplicationsSheetData();
  return <ApplicationsSheet rows={rows} programs={programs} />;
}
