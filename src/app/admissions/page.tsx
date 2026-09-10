import Link from 'next/link';
export const metadata = { title: 'Application Guide & Fees | CRI' };
export default function AdmissionsPage() {
  return <article className="max-w-4xl mx-auto pt-36 pb-24 px-6 text-gray-700">
    <h1 className="text-4xl sm:text-5xl font-black text-gray-900">Before you apply</h1>
    <p className="text-lg mt-5 leading-relaxed">Your interests are the starting point. Tell us what you want to investigate, what you have already explored, and the support you need to turn your question into a student-authored paper.</p>
    <ol className="grid sm:grid-cols-2 gap-5 my-10 list-decimal list-inside">
      {[
        ['Choose a program', 'Check the dates, delivery format, eligibility and tuition. For a flexible one-to-one plan or a private-network internship, contact admissions first.'],
        ['Create your account', 'Use an email address you can access. Students and parents or agencies have separate account options. Creating an account does not reserve a place.'],
        ['Prepare and submit', 'Prepare your academic background, contact details, CV in PDF format, research interests, professor preferences and short written responses. Review the information and application fee before submitting.'],
        ['Follow your application', 'Use your dashboard to follow review, interview and decision steps. Tuition and registration arrangements are separate from the application fee.']
      ].map(([title,body])=><li key={title} className="bg-white border border-gray-200 rounded-2xl p-6"><strong className="text-gray-900">{title}</strong><p className="mt-3 leading-relaxed">{body}</p></li>)}
    </ol>
    <section className="rounded-3xl bg-blue-50 border border-blue-100 p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900">Application fee and tuition are separate</h2>
      <p className="mt-4">The application fee is <strong>USD 50</strong>. It covers the application review process and is not the program tuition or a confirmation of admission.</p>
      <p className="mt-3">The program tuition is shown on each program page. For example, a program with USD 8,580 tuition has a separate USD 50 application fee. Winter tuition varies by program; one-to-one tuition is available on inquiry.</p>
      <p className="mt-3">Before paying, check the exact amount and currency shown at checkout. Contact admissions for payment timing, included services, cancellation and refund terms if these have not been provided for your program.</p>
    </section>
    <h2 className="text-2xl font-bold text-gray-900 mt-10">Need help choosing?</h2>
    <p className="mt-3">Share your current grade or academic level, interests and availability. No finished research proposal is needed to start a conversation. Do not send passwords, payment card details or identity documents through the inquiry form.</p>
    <div className="flex flex-wrap gap-4 mt-6"><Link className="rounded-xl px-6 py-3 bg-gray-900 text-white font-semibold" href="/contact">Ask admissions</Link><Link className="rounded-xl px-6 py-3 border border-gray-300 font-semibold" href="/research">Compare programs</Link></div>
  </article>;
}
