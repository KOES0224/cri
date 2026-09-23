import type { Metadata } from 'next';
import Link from "@/i18n/link";
import { getDictionary, getLocale } from '@/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.legal.privacy.metaTitle };
}

export default async function PrivacyPage() {
  const t = getDictionary(await getLocale()).legal.privacy;
  return <article className="max-w-3xl mx-auto px-6 pt-36 pb-24 text-gray-700 space-y-6 leading-relaxed">
    <h1 className="text-4xl font-bold text-gray-900">{t.title}</h1>
    <p>{t.intro}</p>
    <h2 className="text-2xl font-bold text-gray-900">{t.provided.heading}</h2>
    <p>{t.provided.body}</p>
    <h2 className="text-2xl font-bold text-gray-900">{t.access.heading}</h2>
    <p>{t.access.body}</p>
    <h2 className="text-2xl font-bold text-gray-900">{t.requests.heading}</h2>
    <p>{t.requests.bodyA}<a className="text-blue-700 underline" href="mailto:support@cri.kr">support@cri.kr</a>{t.requests.bodyB}</p>
    <p>{t.requests.note}</p>
    <Link href="/contact" className="text-blue-700 underline">{t.contact}</Link>
  </article>;
}
