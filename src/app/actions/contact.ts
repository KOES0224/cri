"use server";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { allowRequest } from '@/lib/request-limit';
import { z } from 'zod';
const schema = z.object({
  firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().max(100),
  email: z.string().trim().toLowerCase().email().max(254), message: z.string().trim().min(1).max(5000),
  topic: z.string().max(100).optional(), programId: z.string().max(100).optional(),
});
export async function submitContactForm(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Please check your name, email and message. Messages may contain up to 5,000 characters.' };
  try {
    const data = parsed.data;
    if (!await allowRequest('contact', data.email, 5, 600)) return { success: false, error: 'Please wait a few minutes before sending another inquiry.' };
    const session = await getServerSession(authOptions);
    const program = data.programId ? await prisma.program.findFirst({ where: { id: data.programId, isPublished: true }, select: { title: true } }) : null;
    await prisma.lead.create({ data: {
      userId: session?.user?.id || null, name: `${data.firstName} ${data.lastName}`.trim(), email: data.email,
      notes: [data.topic === 'internship' ? 'Private internship consultation' : '', program ? `Program: ${program.title}` : '', data.message].filter(Boolean).join('\n\n'), status: 'NEW',
    } });
    return { success: true };
  } catch { return { success: false, error: 'Your message could not be sent. Please try again or email support@cri.kr.' }; }
}
