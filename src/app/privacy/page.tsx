import Link from 'next/link';
export const metadata = { title: 'Account & Inquiry Privacy Information | CRI' };
export default function PrivacyPage() {
  return <article className="max-w-3xl mx-auto px-6 pt-36 pb-24 text-gray-700 space-y-6 leading-relaxed">
    <h1 className="text-4xl font-bold text-gray-900">Account and inquiry privacy information</h1>
    <p>CRI uses the information you provide to respond to inquiries, manage accounts, assess applications and administer programs.</p>
    <h2 className="text-2xl font-bold text-gray-900">Information you provide</h2>
    <p>Account information includes your name, email address and account type. Inquiries include your contact details and message. Applications may include academic background, research interests, written responses and supporting documents.</p>
    <h2 className="text-2xl font-bold text-gray-900">Account access and service providers</h2>
    <p>Account access uses session cookies. Google sign-in is optional. Payments are handled through the payment provider shown at checkout. CRI uses service providers to host the service and manage application records.</p>
    <h2 className="text-2xl font-bold text-gray-900">Your questions and requests</h2>
    <p>Contact <a className="text-blue-700 underline" href="mailto:support@cri.kr">support@cri.kr</a> with questions about information use, retention, access, correction or deletion. Identity verification may be needed before an account-related request can be handled.</p>
    <p>Do not include passwords or payment card details in inquiries. Use the designated application upload flow for supporting documents.</p>
    <Link href="/contact" className="text-blue-700 underline">Contact CRI</Link>
  </article>;
}
