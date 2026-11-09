import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isPaymentReviewer } from "@/lib/payment-review";

// The sample products themselves are plain data in ./pg-review-products (also used in the browser).
export { PG_REVIEW_PRODUCT, PG_REVIEW_PRODUCT_USD, PG_REVIEW_PRODUCTS, REVIEW_ORDER_PREFIX, reviewProductForOrder, type ReviewProductKey } from "@/lib/pg-review-products";

/** The signed-in visitor if they may see the review products (the payment-review account and admins), else null. Nothing here touches applications. */
export async function pgReviewViewer(): Promise<{ id: string; email: string | null; name: string | null } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN" && !(await isPaymentReviewer(session.user.id))) return null;
  return { id: session.user.id, email: session.user.email ?? null, name: session.user.name ?? null };
}
