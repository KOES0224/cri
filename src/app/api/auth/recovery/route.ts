import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { allowRequest } from '@/lib/request-limit';
import { validNewPassword } from '@/lib/password-policy';
import { z } from 'zod';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const message = 'If this address has a password account, a reset link will be sent. Check your inbox and spam folder. If you use Google, continue with Google sign-in.';
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.token !== undefined) {
      if (!/^[a-f0-9]{64}$/.test(body.token) || !validNewPassword(body.password)) return NextResponse.json({ error: 'Use the complete reset link and a password of at least 12 characters (up to 72 bytes).' }, { status: 400 });
      if (!await allowRequest('reset-token', digest(body.token), 5, 900)) return NextResponse.json({ error: 'Please request a new reset link.' }, { status: 429 });
      const token = `reset:${digest(body.token)}`;
      const record = await prisma.verificationToken.findUnique({ where: { token } });
      if (!record || record.expires <= new Date()) return NextResponse.json({ error: 'This link is invalid or expired. Request a new one.' }, { status: 400 });
      const password = await bcrypt.hash(body.password, 12);
      await prisma.$transaction(async tx => {
        const consumed = await tx.verificationToken.deleteMany({ where: { token, expires: { gt: new Date() } } });
        if (consumed.count !== 1) throw new Error('Expired token');
        await tx.user.update({ where: { id: record.identifier }, data: { password, sessionVersion: { increment: 1 } } });
        await tx.verificationToken.deleteMany({ where: { identifier: record.identifier, token: { startsWith: 'reset:' } } });
      });
      return NextResponse.json({ message: 'Your password has been updated. Sign in again with your new password.' });
    }
    const parsed = z.string().trim().toLowerCase().email().max(254).safeParse(body.email);
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM || !process.env.NEXTAUTH_URL) return NextResponse.json({ error: 'Email recovery is currently unavailable. Contact support@cri.kr for account help. Never send your password.' }, { status: 503 });
    if (!await allowRequest('reset-email', parsed.data, 3, 900)) return NextResponse.json({ message });
    const user = await prisma.user.findUnique({ where: { email: parsed.data }, select: { id: true, password: true } });
    if (user?.password) {
      const raw = randomBytes(32).toString('hex');
      await prisma.verificationToken.create({ data: { identifier: user.id, token: `reset:${digest(raw)}`, expires: new Date(Date.now() + 30 * 60 * 1000) } });
      const url = new URL('/auth/recovery', process.env.NEXTAUTH_URL);
      url.searchParams.set('token', raw);
      const response = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.AUTH_EMAIL_FROM, to: parsed.data, subject: 'Reset your CRI password', text: `A password reset was requested for your CRI account. This link expires in 30 minutes and can be used once:\n\n${url}\n\nIf you did not request this, you can ignore this email. Never share this link or your password.` });
      if (response.error) console.error('Password recovery email could not be delivered');
    }
    return NextResponse.json({ message });
  } catch { return NextResponse.json({ error: 'Unable to complete this request. Please try again or contact support@cri.kr.' }, { status: 400 }); }
}
