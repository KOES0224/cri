"use server";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { allowRequest } from '@/lib/request-limit';
import { notifyContactInquiry } from '@/lib/notify';
import { COUNTRY_CODES } from '@/lib/countries';
import { META_VALUES, applicantRegion, programContent, type MetaCustomData } from '@/lib/meta/config';
import { sendMetaEvent } from '@/lib/meta/capi';
import { z } from 'zod';
const schema = z.object({
  firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().max(100),
  email: z.string().trim().toLowerCase().email().max(254), message: z.string().trim().min(1).max(5000),
  topic: z.string().max(100).optional(), programId: z.string().max(100).optional(),
  country: z.enum(COUNTRY_CODES), applicantType: z.enum(['parent', 'student', 'other']),
});
export type ContactResult = { success: true; tracking: MetaCustomData; eventId: string } | { success: false; error: string };
export async function submitContactForm(input: z.input<typeof schema>): Promise<ContactResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Please check your name, email, country and message. Messages may contain up to 5,000 characters.' };
  try {
    const data = parsed.data;
    if (!await allowRequest('contact', data.email, 5, 600)) return { success: false, error: 'Please wait a few minutes before sending another inquiry.' };
    const session = await getServerSession(authOptions);
    const program = data.programId ? await prisma.program.findFirst({ where: { id: data.programId, isPublished: true }, select: { id: true, title: true, category: true, subCategory: true, professors: { select: { name: true, university: true, relatedMajor: true, potentialTopics: true } } } }) : null;
    const name = `${data.firstName} ${data.lastName}`.trim();
    const lead = await prisma.lead.create({ data: {
      userId: session?.user?.id || null, name, email: data.email, country: data.country, applicantType: data.applicantType,
      notes: [data.topic === 'internship' ? 'Private internship consultation' : '', program ? `Program: ${program.title}` : '', data.message].filter(Boolean).join('\n\n'), status: 'NEW',
    } });
    // The lead is saved; the email to admissions is best effort and never fails the request.
    await notifyContactInquiry({ name, email: data.email, message: data.message, topic: data.topic || undefined, programTitle: program?.title, leadId: lead.id });
    // Conversions API copy of the Lead event (hashed email/name/country only). The lead id is the event id, so the
    // browser's pixel call (fired with the returned id) and any retry deduplicate to one Lead.
    const { data: tracking } = await sendMetaEvent({
      name: 'Lead', eventId: lead.id,
      person: { email: data.email, firstName: data.firstName, lastName: data.lastName, country: data.country, externalId: session?.user?.id },
      data: {
        ...(program ? programContent(program) : { content_name: data.topic === 'internship' ? 'Internship consultation' : 'General inquiry', content_category: data.topic || 'contact' }),
        applicant_type: data.applicantType === 'other' ? undefined : data.applicantType, applicant_region: applicantRegion(data.country),
        ...(META_VALUES.lead ? { value: META_VALUES.lead, currency: 'USD' } : {}),
      },
    });
    return { success: true, tracking, eventId: lead.id };
  } catch { return { success: false, error: 'Your message could not be sent. Please try again or email support@cri.kr.' }; }
}
