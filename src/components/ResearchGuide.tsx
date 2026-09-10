import Link from 'next/link';
import { programFacts } from '@/lib/program-policy';
export default function ResearchGuide({ category }: { category?: string }) {
  const facts = category ? programFacts({ category }) : null;
  return <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 my-8 text-gray-700" aria-label="Research approach and participation">
    <h2 className="text-2xl font-bold text-gray-900 mb-3">Your interests. Your question. Your paper.</h2>
    <p className="leading-relaxed">Research at CRI begins with what the student wants to investigate. Students develop their own question and write their own paper, with faculty and TA guidance on methods, evidence and revision. A course theme provides a starting point, not a predetermined paper to reproduce.</p>
    {facts && <dl className="grid sm:grid-cols-2 gap-5 mt-6">
      <div><dt className="font-bold">Who it is for</dt><dd className="mt-1">{facts.audience}</dd></div>
      <div><dt className="font-bold">Format and duration</dt><dd className="mt-1">{facts.format}. {facts.duration}</dd></div>
      <div><dt className="font-bold">Professor instruction</dt><dd className="mt-1">{facts.professorHours}</dd></div>
      <div><dt className="font-bold">TA guidance</dt><dd className="mt-1">{facts.taHours}</dd></div>
    </dl>}
    <p className="text-sm leading-relaxed mt-5">The aim is a student-authored research manuscript. Preparing a manuscript, submitting it to a journal and having it accepted are separate steps; publication and university admission are not guaranteed.</p>
    <Link href="/admissions" className="inline-block mt-4 font-semibold text-blue-700 underline underline-offset-4">How applications and fees work</Link>
  </section>;
}
