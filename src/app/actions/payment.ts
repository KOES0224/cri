"use server";
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { admissionState } from '@/lib/program-policy';
import { APPLICATION_CHARGE } from '@/lib/application-fee';
import { applicationSchema } from '@/lib/application-validation';
import { allowRequest } from '@/lib/request-limit';
import { confirmTossPayment, findConfirmedTossPayment } from '@/lib/toss';
import { revalidatePath } from 'next/cache';

export async function beginApplicationCheckout(programId: string, input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Sign in before applying.' };
  if (!process.env.TOSS_SECRET_KEY || !process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY) return { error: 'Online payment is unavailable. Contact admissions before paying.' };
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return { error: `Check the application fields and word limits: ${parsed.error.issues[0]?.path.join('.') || 'application'}.` };
  try {
    if (!await allowRequest('checkout', session.user.id, 5, 600)) return { error: 'Please wait before starting another checkout.' };
    const [program, document, existing] = await Promise.all([
      prisma.program.findUnique({ where: { id: programId } }),
      prisma.applicationDocument.findFirst({ where: { id: parsed.data.resumeUrl.split('/').pop(), userId: session.user.id }, select: { id: true } }),
      prisma.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId } } }),
    ]);
    if (!program || admissionState(program) !== 'OPEN') return { error: 'This program is no longer accepting applications. Please choose an available program.' };
    if (!document) return { error: 'Please upload your CV again using this account.' };
    if (existing) return { error: 'You have already applied to this program. Check your dashboard.' };
    const order = await prisma.$transaction(async tx => {
      // Only one active checkout per student/program can reach the provider.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.user.id + ':' + programId}))`;
      const pending = await tx.applicationCheckout.findUnique({ where: { userId_programId: { userId: session.user.id, programId } } });
      if (pending?.status === 'COMPLETED') throw new Error('Already completed');
      if (pending) {
        if (pending.expiresAt <= new Date()) throw new Error('CHECKOUT_REVIEW');
        if (JSON.stringify(applicationSchema.parse(pending.formData)) !== JSON.stringify(parsed.data)) throw new Error('CHECKOUT_CHANGED');
        return pending;
      }

      return tx.applicationCheckout.create({ data: {
      id: `CRI_${randomUUID()}`, userId: session.user.id, programId, formData: parsed.data,
      amount: APPLICATION_CHARGE.amount, currency: APPLICATION_CHARGE.currency,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    } });
    });
    return { orderId: order.id, amount: order.amount, currency: APPLICATION_CHARGE.currency, orderName: `${program.title.slice(0, 75)} — application fee` };
  } catch (error) {
    if (error instanceof Error && error.message === 'CHECKOUT_CHANGED') return {error: 'An earlier checkout is pending. Reload to resume your saved application. Contact admissions to revise it before paying.'};
    if (error instanceof Error && error.message === 'CHECKOUT_REVIEW') return {error: 'Your earlier checkout needs review. Contact admissions before paying again so we can check its payment status.'};
    return { error: 'Unable to prepare checkout. Your payment has not been started. Please try again.' };
  }
}

export async function finalizePaidApplication({ paymentKey, orderId, amount }: { paymentKey: string; orderId: string; amount: number }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Sign in with the account used for checkout.' };
  if (typeof paymentKey !== 'string' || paymentKey.length > 500 || typeof orderId !== 'string' || orderId.length > 100) return { error: 'Invalid payment reference.' };
  try {
    const order = await prisma.applicationCheckout.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== session.user.id || order.amount !== amount || amount !== APPLICATION_CHARGE.amount || order.currency !== APPLICATION_CHARGE.currency) return { error: 'Payment details could not be verified. Contact support if you have a receipt.' };
    if (order.status === 'COMPLETED' && order.applicationId) return { success: true, applicationId: order.applicationId, receiptUrl: undefined };
    const program = await prisma.program.findUnique({ where: { id: order.programId } });
    // Recheck immediately before asking the payment provider to confirm the charge.
    const canCharge = program && admissionState(program) === 'OPEN' && order.expiresAt > new Date();
    const existing = await prisma.application.findUnique({ where: { userId_programId: { userId: session.user.id, programId: order.programId } } });
    if (existing) return { error: 'An application already exists. Check your dashboard before making another payment.' };
    // A successful prior charge may be reconciled even after admissions close.
    const recovered = await findConfirmedTossPayment(orderId, order.amount);
    if (!recovered.success && !canCharge) return {error: 'This checkout has expired or the program has closed. Contact support with your order reference before paying again.'};
    const confirmed = recovered.success ? recovered : await confirmTossPayment(paymentKey, orderId, order.amount);
    if (!confirmed.success || !confirmed.paymentData) return { error: confirmed.error || 'Payment could not be confirmed. Please try again or contact support.' };
    const payment = confirmed.paymentData;
    const applicationId = await prisma.$transaction(async tx => {
      // Lock the order to make duplicate provider callbacks idempotent.
      await tx.$queryRaw`SELECT "id" FROM "ApplicationCheckout" WHERE "id" = ${orderId} FOR UPDATE`;
      const locked = await tx.applicationCheckout.findUniqueOrThrow({ where: { id: orderId } });
      if (locked.applicationId) return locked.applicationId;
      const app = await tx.application.create({ data: {
        userId: session.user.id, programId: order.programId, status: 'PENDING', stage: 'REVIEW', expectedWaitDays: 7,
        content: JSON.stringify({ ...(order.formData as Record<string, unknown>), payment: { feeStatus: 'PAID', amount: payment.totalAmount, currency: payment.currency, orderId, receiptUrl: payment.receiptUrl, approvedAt: payment.approvedAt } }),
        steps: { create: [
          { title: 'Application & Fee Submitted', status: 'COMPLETED', order: 1, date: new Date() },
          { title: 'Admissions Review', status: 'IN_PROGRESS', order: 2 },
          { title: 'Admissions Interview', status: 'UPCOMING', order: 3 },
          { title: 'Final Decision', status: 'UPCOMING', order: 4 },
        ] },
      } });
      await tx.applicationCheckout.update({ where: { id: orderId }, data: { status: 'COMPLETED', applicationId: app.id, formData: {} } });
      return app.id;
    });
    // Only the completed application is exported; payment keys and card details are never included.
    try {
      const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: { program: true, user: true } });
      const { syncApplicationToGoogleSheet } = await import('@/lib/googleSheets');
      await syncApplicationToGoogleSheet({ application: app, user: session.user, program: app.program, formData: JSON.parse(app.content || '{}') });
    } catch { console.error('Application saved; spreadsheet sync requires retry.'); }
    revalidatePath('/dashboard', 'layout');
    return { success: true, applicationId, receiptUrl: payment.receiptUrl };
  } catch {
    return { error: 'We could not finish recording your application. If a charge appears, do not pay again. Contact support@cri.kr with your order reference.' };
  }
}
