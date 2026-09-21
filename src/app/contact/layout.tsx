import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// /contact/page.tsx is a client component, so its metadata lives in this segment layout.
export const metadata: Metadata = pageMetadata({
  title: "Contact | CRI",
  description:
    "Ask CRI admissions about research programs, internships, eligibility, schedules and tuition. Send a message and we will reply by email.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
