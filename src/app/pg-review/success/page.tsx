import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pgReviewViewer } from "@/lib/pg-review";
import SuccessClient from "./SuccessClient";

export const dynamic = "force-dynamic";
/** The confirm call may wait up to 30 seconds for a card network. */
export const maxDuration = 90;
export const metadata: Metadata = { title: "결제 완료 | CRI", robots: { index: false, follow: false } };

export default async function PgReviewSuccessPage() {
  if (!(await pgReviewViewer())) notFound();
  return <SuccessClient />;
}
