import Link from 'next/link';
export const metadata = { title: 'Cancellation & Refund Policy | CRI' };
const english = [
'CRI programs have limited enrollment. Upon registration, faculty and TA schedules and student-specific research preparation are arranged.',
'The application fee pays for admissions review services, including application assessment, and is separate from program tuition. Before payment, the company provides information about the service, when it begins and any conditions limiting withdrawal. Once admissions review services have actually begun, withdrawal from those services may be restricted to the extent permitted by applicable law.',
'When a program is cancelled by a participant, the refund amount is calculated by distinguishing services actually provided from services not yet provided. Sending materials or reserving a place alone does not exclude the entire price of unprovided services from a refund.',
'Consumer rights concerning services not provided by the company or performance that differs from the contract, and rights to withdrawal, termination and refunds under applicable law, remain protected.'
];
const korean = [
'CRI 프로그램은 정원제로 운영되며, 등록에 따라 교수·TA 일정과 학생별 연구 준비가 진행됩니다.',
'지원비는 지원서 검토 등 입학 심사 서비스의 대가이며, 프로그램 수업료와 별개입니다. 회사는 결제 전에 서비스 내용과 개시 시점, 청약철회 제한 조건을 안내합니다. 실제 심사 서비스가 개시된 이후에는 관계 법령이 허용하는 범위에서 해당 서비스의 청약철회가 제한될 수 있습니다.',
'프로그램 취소 시에는 실제 제공된 서비스와 아직 제공되지 않은 서비스를 구분하여 환불 금액을 산정합니다. 자료 발송이나 정원 확보만을 이유로 미제공 서비스 대금 전액을 환불 대상에서 제외하지 않습니다.',
'회사의 서비스 미제공 또는 계약과 다른 이행에 대한 권리와 관계 법령에 따른 소비자의 청약철회·계약해지·환불 권리는 보장됩니다.'
];
export default function RefundsPage() {
return <article className="mx-auto max-w-4xl px-6 pb-24 pt-36 text-gray-700">
  <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Admissions information</p>
  <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">Cancellation &amp; refunds</h1>
  <p className="mt-5 text-sm text-gray-500">Elite Research Co., Ltd. · Business registration number: 863-87-02851</p>
  <section className="mt-8 space-y-5 rounded-3xl border border-gray-200 bg-white p-6 leading-relaxed sm:p-8" lang="en" aria-label="Cancellation and refund policy in English">{english.map(text=><p key={text}>{text}</p>)}</section>
  <section className="mt-8 space-y-5 rounded-3xl border border-blue-100 bg-blue-50 p-6 leading-relaxed sm:p-8" lang="ko"><h2 className="text-2xl font-bold text-gray-900">취소 및 환불 안내</h2>{korean.map(text=><p key={text}>{text}</p>)}</section>
  <section className="mt-10"><h2 className="text-xl font-bold text-gray-900">Request a cancellation or refund</h2><p className="mt-3 leading-relaxed">Contact <a href="mailto:support@cri.kr" className="text-blue-700 underline">support@cri.kr</a> or <a href="tel:+82262038999" className="text-blue-700 underline">+82 2-6203-8999</a> with your name, program and application or order reference. Do not send passwords or full payment card details.</p></section>
  <Link href="/admissions" className="mt-8 inline-block font-semibold text-blue-700 underline">Application guide and fees</Link>
</article>;
}
