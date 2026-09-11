import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Trophy, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Competition Preparation | CRI",
  description: "Explore ISEF, Conrad Challenge and iGEM preparation with CRI. Contact us for a private consultation on competition fit and participation.",
};

const competitions = [
  {
    name: "Regeneron ISEF",
    field: "Science & engineering",
    description: "An international science and engineering fair where high school students present original research. Finalists qualify through Society for Science–affiliated fairs.",
    url: "https://www.societyforscience.org/isef/",
  },
  {
    name: "Conrad Challenge",
    field: "Innovation & entrepreneurship",
    description: "A team competition that brings science, technology and entrepreneurship together. Students develop innovative solutions to real-world challenges and explain their potential impact.",
    url: "https://www.conradchallenge.org/",
  },
  {
    name: "iGEM",
    field: "Synthetic biology",
    description: "A global synthetic biology competition for student teams, including high school and university students. Teams use biology and engineering to address real-world problems.",
    url: "https://competition.igem.org/about",
  },
];

export default function CompetitionProjectsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 pt-32 sm:pb-32">
      <div className="mx-auto max-w-7xl px-6">
        <Link href="/projects" className="mb-10 inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
          <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />Back to Projects
        </Link>
        <header className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-800">
            <Trophy aria-hidden="true" className="h-4 w-4" />Competition preparation
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tighter text-gray-900 sm:text-6xl">Original ideas.<br />International ambition.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">Prepare for international research and innovation competitions with CRI. Explore the right direction for your interests, experience and goals through a personal consultation.</p>
          <Link href="/contact" className="mt-8 inline-flex items-center gap-3 rounded-xl bg-black px-6 py-4 font-bold text-white transition-colors hover:bg-gray-800">Inquire about participation<ArrowUpRight aria-hidden="true" className="h-5 w-5" /></Link>
        </header>

        <section aria-labelledby="competition-options" className="mt-16">
          <h2 id="competition-options" className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Explore the competitions</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-gray-600">Three distinct paths for scientific inquiry, practical innovation and collaborative research.</p>
          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {competitions.map((competition) => (
              <article key={competition.name} className="flex flex-col rounded-3xl border border-gray-200/90 bg-white p-7 shadow-sm sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-800">{competition.field}</p>
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">{competition.name}</h3>
                <p className="mb-7 mt-4 flex-1 leading-relaxed text-gray-600">{competition.description}</p>
                <a href={competition.url} className="inline-flex items-center gap-2 self-start text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900">Official competition website<span className="sr-only">: {competition.name}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">Eligibility, entry routes and deadlines are set by each organizer. Contact us to discuss the current cycle or another competition you have in mind.</p>
        </section>

        <section aria-labelledby="competition-experience" className="mt-12 overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-sm">
          <div className="grid lg:grid-cols-2">
            <div className="p-7 sm:p-10">
              <Trophy aria-hidden="true" className="mb-5 h-7 w-7 text-amber-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-800">Our track record</p>
              <h2 id="competition-experience" className="mt-3 text-3xl font-bold tracking-tight text-gray-900">Experience behind award-winning work.</h2>
              <p className="mt-5 leading-relaxed text-gray-600">CRI students have earned recognition in competitive settings. That experience informs how we support each student as they develop and communicate their own original work.</p>
              <p className="mt-4 leading-relaxed text-gray-600">Ask our team about relevant past achievements and the experience we can bring to your intended competition.</p>
            </div>
            <div className="border-t border-gray-200/90 bg-gray-50/80 p-7 sm:p-10 lg:border-l lg:border-t-0">
              <ShieldCheck aria-hidden="true" className="mb-5 h-7 w-7 text-gray-700" />
              <h3 className="text-xl font-bold tracking-tight text-gray-900">Original work deserves discretion.</h3>
              <p className="mt-5 leading-relaxed text-gray-600">To protect student originality and competition strategy, we do not publish project concepts, preparation materials or submission details. Program fit and the preparation process are discussed individually, with appropriate respect for student and team confidentiality.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="competition-inquiry" className="mt-12 rounded-3xl bg-gray-900 p-7 text-white sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <h2 id="competition-inquiry" className="text-3xl font-bold tracking-tight">Let’s discuss your next competition.</h2>
            <p className="mt-4 leading-relaxed text-gray-300">For current openings, timelines and preparation options, contact our team. Share your grade, areas of interest, target competition and availability. A brief overview is enough for an initial inquiry; unpublished research or submission materials are not needed.</p>
          </div>
          <div className="mt-7 flex shrink-0 flex-col items-start gap-4 lg:mt-0">
            <Link href="/contact" className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 font-bold text-gray-900 transition-colors hover:bg-gray-100">Contact CRI<ArrowUpRight aria-hidden="true" className="h-5 w-5" /></Link>
            <a href="mailto:support@cri.kr" className="text-sm text-gray-300 underline underline-offset-4 hover:text-white">support@cri.kr</a>
          </div>
        </section>
      </div>
    </div>
  );
}
