"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { confirmTossPayment } from "@/lib/toss";
import { syncApplicationToGoogleSheet } from "@/lib/googleSheets";

interface FinalizePaidApplicationParams {
  programId: string;
  formData: Record<string, any>;
  paymentKey: string;
  orderId: string;
  amount: number;
}

export async function finalizePaidApplication({
  programId,
  formData,
  paymentKey,
  orderId,
  amount,
}: FinalizePaidApplicationParams) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return { error: "Authentication required. Please log in to complete your application." };
  }

  // 1. Check for existing application
  const existing = await prisma.application.findUnique({
    where: {
      userId_programId: {
        userId: session.user.id,
        programId,
      },
    },
  });

  if (existing) {
    return { error: "You have already submitted an application for this program." };
  }

  // 2. Server-side payment verification with Toss Payments
  const confirmResult = await confirmTossPayment(paymentKey, orderId, amount);

  if (!confirmResult.success || !confirmResult.paymentData) {
    return {
      error: confirmResult.error || "Payment verification failed. Please contact support if your card was charged.",
    };
  }

  const paymentData = confirmResult.paymentData;

  try {
    // 3. Enrich application form content with verified payment metadata
    const enrichedContent = {
      ...formData,
      payment: {
        feeStatus: "PAID",
        amount: paymentData.totalAmount,
        currency: paymentData.currency,
        paymentKey: paymentData.paymentKey,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        receiptUrl: paymentData.receiptUrl || "",
        approvedAt: paymentData.approvedAt || new Date().toISOString(),
        method: paymentData.method,
        card: paymentData.card ? {
          number: paymentData.card.number,
          cardType: paymentData.card.cardType,
          approveNo: paymentData.card.approveNo,
        } : undefined,
      },
    };

    // 4. Create application in database
    const app = await prisma.application.create({
      data: {
        userId: session.user.id,
        programId,
        content: JSON.stringify(enrichedContent),
        status: "PENDING",
        stage: "REVIEW",
        expectedWaitDays: 7,
      },
      include: {
        program: true,
        user: true,
      },
    });

    // 5. Initialize application pipeline steps
    await prisma.applicationStep.createMany({
      data: [
        {
          applicationId: app.id,
          title: "Application & Fee Submitted",
          status: "COMPLETED",
          order: 1,
          date: new Date(),
        },
        {
          applicationId: app.id,
          title: "Admissions Review",
          status: "IN_PROGRESS",
          order: 2,
        },
        {
          applicationId: app.id,
          title: "Admissions Interview",
          status: "UPCOMING",
          order: 3,
        },
        {
          applicationId: app.id,
          title: "Final Decision",
          status: "UPCOMING",
          order: 4,
        },
      ],
    });

    // 6. Asynchronously stream to Google Sheet (safe non-blocking)
    try {
      await syncApplicationToGoogleSheet({
        application: app,
        user: session.user,
        program: app.program,
        formData: enrichedContent,
      });
    } catch (sheetErr) {
      console.error("Google Sheets sync notice:", sheetErr);
    }

    revalidatePath("/dashboard/applications");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/applications-admin");
    revalidatePath("/dashboard/applications-admin/sheet");

    return {
      success: true,
      applicationId: app.id,
      receiptUrl: paymentData.receiptUrl,
    };
  } catch (err: any) {
    console.error("Error creating paid application record:", err);
    return {
      error: "Payment was processed, but we encountered an issue recording your application. Our admissions team has been notified.",
    };
  }
}
