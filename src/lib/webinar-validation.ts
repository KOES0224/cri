import { z } from "zod";

/** Sign-up form rules; codes map to t.webinar.errors. At least one of phone, email or Kakao id is required. */
export const webinarRegistrationSchema = z
  .object({
    name: z.string().trim().min(1, "name").max(100, "name"),
    role: z.enum(["PARENT", "STUDENT", "OTHER"], { message: "role" }),
    phone: z.string().trim().max(40, "phone").default(""),
    email: z.string().trim().max(254, "email").default(""),
    kakaoId: z.string().trim().max(60, "kakao").default(""),
    question: z.string().trim().max(1000, "question").default(""),
    consent: z.literal(true, { message: "consent" }),
  })
  .superRefine((data, ctx) => {
    if (!data.phone && !data.email && !data.kakaoId) ctx.addIssue({ code: "custom", path: ["contact"], message: "contact" });
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) ctx.addIssue({ code: "custom", path: ["email"], message: "email" });
    if (data.phone && data.phone.replace(/\D/g, "").length < 8) ctx.addIssue({ code: "custom", path: ["phone"], message: "phone" });
  });

export type WebinarRegistrationInput = z.input<typeof webinarRegistrationSchema>;

/** One validation code per field (contact = none of the three contact fields given). */
export function webinarErrors(input: unknown): Record<string, string> {
  const parsed = webinarRegistrationSchema.safeParse(input);
  if (parsed.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return errors;
}
