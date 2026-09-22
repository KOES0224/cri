import Link from 'next/link';
import { APPLICATION_CHARGE_LABEL, APPLICATION_FEE_ENABLED } from '@/lib/application-fee';
import { getDictionary, getLocale } from '@/i18n';
export const metadata = { title: 'Application Guide & Fees | CRI' };
export default async function AdmissionsPage() {
  const t = getDictionary(await getLocale()).admissions;
  return <article className="max-w-4xl mx-auto pt-36 pb-24 px-6 text-gray-700">
    <h1 className="text-4xl sm:text-5xl font-black text-gray-900">{t.title}</h1>
    <p className="text-lg mt-5 leading-relaxed">{t.intro}</p>
    <ol className="grid sm:grid-cols-2 gap-5 my-10 list-decimal list-inside">
      {t.steps.map(([title,body])=><li key={title} className="bg-white border border-gray-200 rounded-2xl p-6"><strong className="text-gray-900">{title}</strong><p className="mt-3 leading-relaxed">{body}</p></li>)}
    </ol>
    <section className="rounded-3xl bg-blue-50 border border-blue-100 p-6 sm:p-8">
      {APPLICATION_FEE_ENABLED ? (<>
      <h2 className="text-2xl font-bold text-gray-900">{t.feeHeading}</h2>
      <p className="mt-4">{t.feeP1a}<strong>USD 50</strong>{t.feeP1b}<strong>{APPLICATION_CHARGE_LABEL}</strong>{t.feeP1c}</p>
      <p className="mt-3">{t.feeP2}</p>
      <p className="mt-3">{t.feeP3a}<Link href="/refunds" className="text-blue-700 underline">{t.feeP3Link}</Link>{t.feeP3b}</p>
      </>) : (<>
      <h2 className="text-2xl font-bold text-gray-900">{t.free.heading}</h2>
      <p className="mt-4">{t.free.p1}</p>
      <p className="mt-3">{t.free.p2} <Link href="/refunds" className="text-blue-700 underline">{t.feeP3Link}</Link></p>
      </>)}
    </section>
    <h2 className="text-2xl font-bold text-gray-900 mt-10">{t.needHelp}</h2>
    <p className="mt-3">{t.helpBody}</p>
    <div className="flex flex-wrap gap-4 mt-6"><Link className="rounded-xl px-6 py-3 bg-gray-900 text-white font-semibold" href="/contact">{t.ask}</Link><Link className="rounded-xl px-6 py-3 border border-gray-300 font-semibold" href="/research">{t.compare}</Link></div>
  </article>;
}
