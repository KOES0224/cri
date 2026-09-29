import type { Metadata } from 'next';
import Link from "@/i18n/link";
import { getDictionary, getLocale } from '@/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await getLocale());
  return { title: t.legal.refunds.metaTitle };
}

const english = [
'CRI programs have limited enrollment. Upon registration, faculty and TA schedules and student-specific research preparation are arranged.',
'The application fee is consideration for admissions review services, including review of the application, and is separate from program tuition. Before payment, the company explains the service, when it begins, and any statutory limits on withdrawal. After the admissions review service has actually begun, the right of withdrawal may be limited to the extent permitted by applicable law.',
'If a participant cancels a program, the refund is calculated by distinguishing services already provided from services not yet provided. The full price of services that have not been provided is not excluded from a refund solely because materials were sent or a place was reserved.',
'The consumer\'s rights under applicable law, including rights relating to services not provided, performance that differs from the contract, withdrawal, termination, and refunds, remain protected.'
];
const korean = [
'CRI 프로그램은 정원제로 운영되며, 등록에 따라 교수·TA 일정과 학생별 연구 준비가 진행됩니다.',
'지원비는 지원서 검토 등 입학 심사 서비스의 대가이며, 프로그램 수업료와 별개입니다. 회사는 결제 전에 서비스 내용과 개시 시점, 청약철회 제한 조건을 안내합니다. 실제 심사 서비스가 개시된 이후에는 관계 법령이 허용하는 범위에서 해당 서비스의 청약철회가 제한될 수 있습니다.',
'프로그램 취소 시에는 실제 제공된 서비스와 아직 제공되지 않은 서비스를 구분하여 환불 금액을 산정합니다. 자료 발송이나 정원 확보만을 이유로 미제공 서비스 대금 전액을 환불 대상에서 제외하지 않습니다.',
'회사의 서비스 미제공 또는 계약과 다른 이행에 대한 권리와 관계 법령에 따른 소비자의 청약철회·계약해지·환불 권리는 보장됩니다.'
];
const policies = { en: english, ko: korean } as const;

export default async function RefundsPage() {
const locale = await getLocale();
const t = getDictionary(locale).legal.refunds;
// The visitor's language comes first; the other language follows under its own heading.
const secondary = locale === 'ko' ? 'en' : 'ko';
return <article className="mx-auto max-w-4xl px-6 pb-24 pt-36 text-gray-700">
  <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{t.eyebrow}</p>
  <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">{t.title}</h1>
  <p className="mt-5 text-sm text-gray-500">{t.company}</p>
  <section className="mt-8 space-y-5 rounded-3xl border border-gray-200 bg-white p-6 leading-relaxed sm:p-8" lang={locale} aria-label={t.primaryLabel}>{policies[locale].map(text=><p key={text}>{text}</p>)}</section>
  <section className="mt-8 space-y-5 rounded-3xl border border-blue-100 bg-blue-50 p-6 leading-relaxed sm:p-8" lang={secondary}><h2 className="text-2xl font-bold text-gray-900">{t.secondaryHeading}</h2>{policies[secondary].map(text=><p key={text}>{text}</p>)}</section>
  <section className="mt-10"><h2 className="text-xl font-bold text-gray-900">{t.requestHeading}</h2><p className="mt-3 leading-relaxed">{t.requestA}<a href="mailto:support@cri.kr" className="text-blue-700 underline">support@cri.kr</a>{t.requestB}<a href="tel:+82262038999" className="text-blue-700 underline">{t.phone}</a>{t.requestC}</p></section>
  <Link href="/admissions" className="mt-8 inline-block font-semibold text-blue-700 underline">{t.guideLink}</Link>
</article>;
}
