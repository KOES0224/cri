import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { programFacts } from '@/lib/program-policy';

export default function ResearchGuide({ category }: { category?: string }) {
  const facts = category ? programFacts({ category }) : null;
  const details = facts ? [
    { label: 'Who it is for', value: facts.audience },
    { label: 'Learning format', value: facts.format },
    { label: 'Professor instruction', value: facts.professorHours },
    { label: 'TA guidance', value: facts.taHours },
  ] : [];

  return (
    <section className="@container my-10 overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-sm" aria-label="Research approach and participation">
      <div className={facts ? "grid @3xl:grid-cols-2" : "grid"}>
        <div className="p-6 sm:p-8 @3xl:p-10">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">The CRI approach</span>
          </div>
          <h2 className="max-w-lg text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">
            Your interests.<br />Your question. <span className="inline-block text-blue-600">Your paper.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-gray-600">
            Start with what you want to investigate. Develop your own research question and write your own paper, with professor and TA guidance on methods, evidence and revision. The course theme is a starting point—not a predetermined paper to reproduce.
          </p>
          <Link href="/admissions" className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800">
            Applications &amp; fees
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
          </Link>
        </div>
        {facts && (
          <div className="border-t border-gray-100 bg-gray-50/70 p-6 sm:p-8 @3xl:border-l @3xl:border-t-0 @3xl:p-10">
            <p className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">Program at a glance</p>
            <dl className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
              {details.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</dt>
                  <dd className="mt-2 text-sm font-semibold leading-relaxed text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 border-t border-gray-200/80 pt-5 text-sm leading-relaxed text-gray-500">{facts.duration}</p>
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 px-6 py-4 sm:px-8 @3xl:px-10">
        <p className="max-w-4xl text-xs leading-relaxed text-gray-500">
          Students work toward their own research manuscript. Journal submission and acceptance are separate steps; publication and university admission are not guaranteed.
        </p>
      </div>
    </section>
  );
}
