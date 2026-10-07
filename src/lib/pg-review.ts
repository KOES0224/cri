import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isPaymentReviewer } from "@/lib/payment-review";

/**
 * Won-denominated sample product for the payment gateway's registration review.
 * Only the payment-review account (and admins) can see it; nothing here touches applications.
 */
export const PG_REVIEW_PRODUCT = {
  name: "CRI 지원서 심사 서비스",
  orderName: "CRI 지원서 심사 서비스 (심사용)",
  amount: 10000,
  currency: "KRW",
  label: "₩10,000",
} as const;

/** The signed-in visitor if they may see the review product, else null. */
export async function pgReviewViewer(): Promise<{ id: string; email: string | null; name: string | null } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN" && !(await isPaymentReviewer(session.user.id))) return null;
  return { id: session.user.id, email: session.user.email ?? null, name: session.user.name ?? null };
}
