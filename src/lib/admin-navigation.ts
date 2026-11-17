export const adminNavigation = [
  { group: "Workspace", items: [
    { href: "/dashboard", label: "Overview", icon: "overview" },
    { href: "/dashboard/applications-admin", label: "Applications", icon: "applications" },
    { href: "/dashboard/leads", label: "Inquiries", icon: "inquiries" },
    { href: "/dashboard/webinar", label: "Webinar", icon: "inquiries" },
    { href: "/dashboard/contacts", label: "Customers", icon: "customers" },
    { href: "/dashboard/messages", label: "Messages", icon: "messages" },
    { href: "/dashboard/kakao", label: "KakaoTalk bot", icon: "messages" },
  ] },
  { group: "Management", items: [
    { href: "/dashboard/programs", label: "Programs", icon: "programs" },
    { href: "/dashboard/fee-codes", label: "Referral codes", icon: "codes" },
    { href: "/dashboard/payment-links", label: "Payment links", icon: "payments" },
    { href: "/dashboard/users", label: "People", icon: "people" },
    { href: "/dashboard/cms", label: "Website content", icon: "content" },
    { href: "/dashboard/settings", label: "Settings", icon: "settings" },
  ] },
] as const;

export function adminStatusLabel(status: string) {
  const labels: Record<string, string> = { PENDING: "Pending review", ACCEPTED: "Accepted", REJECTED: "Not accepted", NEW: "New", CONTACTED: "Contacted", MET: "Consulted", ENROLLED: "Enrolled", WAITLISTED: "Waitlisted", NOTE_ADDED: "Note added", STATUS_CHANGE: "Status updated" };
  return labels[status] ?? status.toLowerCase().replaceAll("_", " ");
}
