import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Trophy, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Competition Preparation | CRI",
  description: "Explore science, innovation and entrepreneurship competition pathways with CRI. Contact us for a private consultation on competition fit and participation.",
};

const competitions = [
  {
    name: "Regeneron ISEF",
    logo: "https://www.societyforscience.org/wp-content/uploads/sites/4/2019/12/TW_1024x512.png?w=960",
    photo: "https://www.societyforscience.org/wp-content/uploads/sites/4/2023/05/20230518_Public_Day_0673_KR-960.jpg?w=960",
    logoSurface: "bg-white",
    field: "Science & engineering",
    description: "An international science and engineering fair where high school students present original research. Finalists qualify through Society for Science–affiliated fairs.",
    url: "https://www.societyforscience.org/isef/",
  },
  {
    name: "Conrad Challenge",
    logo: "https://conrad.spacecenter.org/wp-content/uploads/2022/07/Main-Nav-Logo.png",
    photo: "https://conrad.spacecenter.org/wp-content/uploads/2026/08/20260425-CC-D4-3519-DDP_1-L.jpg",
    logoSurface: "bg-[#10203a]",
    field: "Innovation & entrepreneurship",
    description: "A team competition that brings science, technology and entrepreneurship together. Students develop innovative solutions to real-world challenges and explain their potential impact.",
    url: "https://conrad.spacecenter.org/",
  },
  {
    name: "iGEM",
    logo: "https://static.igem.org/websites/common/2025/logos/igem-competition-negative.svg",
    photo: "https://static.igem.org/websites/competition/2025/homepage/54904040195-5252f125ec-k.avif",
    logoSurface: "bg-[#153f38]",
    field: "Synthetic biology",
    description: "A global synthetic biology competition for student teams, including high school and university students. Teams use biology and engineering to address real-world problems.",
    url: "https://competition.igem.org/about",
  },
  {
    name: "Diamond Challenge",
    logo: "https://diamondchallenge.org/wp-content/uploads/2023/11/DC-logo_003C71V-1-e1760459361526.png",
    photo: "https://diamondchallenge.org/wp-content/uploads/2026/06/DiamondChallengeDEPitchEvent_65_02-20-2026-scaled.jpg",
    logoSurface: "bg-white",
    field: "Business & social innovation",
    description: "A high school entrepreneurship competition from the University of Delaware’s Horn Entrepreneurship. Teams develop business or social innovation concepts that address real-world needs.",
    url: "https://diamondchallenge.org/competition/",
  },
  {
    name: "GENIUS Olympiad",
    logo: "https://geniusolympiad.org/assets/img/GeniusLogoHorizontalBrown.png?h=207226479764e24cae0e1be25e0b292d",
    photo: "https://geniusolympiad.org/assets/img/20190621_geniusolympiad2019_0240h.jpg?h=00ea5ffb3fd7163e5ee5a0e059c67446",
    logoSurface: "bg-white",
    field: "Environment & sustainability",
    description: "An international high school project competition centered on environmental issues. Students explore sustainability through science, engineering, business and creative disciplines.",
    url: "https://geniusolympiad.org/aboutUs.html",
  },
  {
    name: "Regeneron STS",
    logo: "https://www.societyforscience.org/wp-content/uploads/sites/4/2023/06/STS_Ribbon_Logo_CMYK_2021-386x620-1.png?w=386",
    photo: "https://www.societyforscience.org/wp-content/uploads/sites/4/2024/06/20240310_PublicDay_068_CA.jpg?w=960",
    logoSurface: "bg-white",
    field: "Independent scientific research",
    description: "A U.S. science research competition for students in their final year of high school. Applicants present independent research; specific schooling and citizenship eligibility requirements apply.",
    url: "https://www.societyforscience.org/regeneron-sts/application-requirements/",
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

        <section aria-labelledby="competition-options" className="mt-16 scroll-mt-28">
          <h2 id="competition-options" className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Explore the competitions</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-gray-600">Explore opportunities across scientific inquiry, entrepreneurship, sustainability and collaborative research. Discuss eligibility and preparation availability with our team.</p>
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {competitions.map((competition) => (
              <article id={competition.name.toLowerCase().replaceAll(" ", "-")} key={competition.name} className="scroll-mt-28 flex flex-col overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-sm">
                <div className="relative isolate flex h-48 items-center justify-center overflow-hidden bg-slate-100">
                  <div aria-hidden="true" className="pointer-events-none absolute -inset-6 -z-20 select-none">
                    <Image src={competition.photo} alt="" fill sizes="(min-width: 1280px) 420px, (min-width: 768px) 50vw, 100vw" quality={60} className="object-cover blur-[16px] saturate-[0.8]" />
                  </div>
                  <div aria-hidden="true" className="absolute inset-0 -z-10 bg-white/30" />
                  <div className={`relative flex h-28 w-60 max-w-[80%] items-center justify-center rounded-2xl border border-white/60 p-4 shadow-lg shadow-black/10 ${competition.logoSurface}`}>
                    <Image src={competition.logo} alt={`${competition.name} logo`} width={220} height={90} className={competition.name === "Regeneron STS" ? "h-24 w-16 shrink-0 object-contain" : "h-full w-full object-contain"} />
                    {competition.name === "Regeneron STS" && <span aria-hidden="true" className="ml-3 text-sm font-bold leading-snug text-[#173469]">Regeneron<br />Science Talent<br />Search</span>}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-7 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-800">{competition.field}</p>
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">{competition.name}</h3>
                <p className="mb-7 mt-4 flex-1 leading-relaxed text-gray-600">{competition.description}</p>
                <a href={competition.url} className="inline-flex items-center gap-2 self-start text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900">Official competition website<span className="sr-only">: {competition.name}</span><ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">Eligibility, entry routes and deadlines are set by each organizer. Contact us to discuss the current cycle or another competition you have in mind.</p>
          <details className="mt-4 text-xs leading-relaxed text-gray-500">
            <summary className="w-fit cursor-pointer rounded py-2 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Image credits</summary>
            <p className="mt-2 max-w-3xl">Logos and event photography: <a href="https://www.societyforscience.org/2024-regeneron-science-talent-search-media-kit/" className="underline">Society for Science / Chris Ayers Photography</a> (ISEF and STS photos), <a href="https://conrad.spacecenter.org/" className="underline">Conrad Challenge / Space Center Houston</a>, <a href="https://competition.igem.org/" className="underline">iGEM Foundation</a>, <a href="https://diamondchallenge.org/" className="underline">Diamond Challenge / Horn Entrepreneurship</a>, and <a href="https://geniusolympiad.org/" className="underline">GENIUS Olympiad</a>. Event photos are blurred for atmosphere and do not depict CRI student results. Competition marks identify their respective organizers.</p>
          </details>
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
