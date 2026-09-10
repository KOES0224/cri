import Link from "next/link";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white pt-20 pb-16 px-6 relative z-10 overflow-hidden border-t border-gray-900">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_60%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Section: Brand Statement & CTA */}
        <div className="pb-16 mb-16 border-b border-gray-900 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-4">
            <Link href="/" className="inline-block text-3xl font-black tracking-tighter text-white">
              CRI<span className="text-blue-500">.</span>
            </Link>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white/95 max-w-xl leading-tight">
              Building the next generation of academic contributors.
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl leading-relaxed pt-2">
              CRI connects high-achieving secondary school scholars with distinguished Ivy League and world-class faculty for rigorous, publishable capstone research and academic distinction.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-4 lg:items-end justify-center">
            <Link
              href="/research"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-950 font-bold rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-white/10 hover-lift click-press"
            >
              Explore Research Cohorts
              <ArrowUpRight className="ml-2 w-5 h-5 text-gray-950" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/5 text-white/90 border border-white/10 font-semibold rounded-full hover:bg-white/10 transition-all click-press"
            >
              Contact Admissions Board
            </Link>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12 pb-16 border-b border-gray-900">
          {/* Column 1: Programs */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Research Programs</p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/research/winter" className="text-gray-300 hover:text-white transition-colors">
                  Winter Online Research Program
                </Link>
              </li>
              <li>
                <Link href="/research/summer-camp" className="text-gray-300 hover:text-white transition-colors">
                  Seoul & Global Research Programs
                </Link>
              </li>
              <li>
                <Link href="/research/1-on-1" className="text-gray-300 hover:text-white transition-colors">
                  1-on-1 Advanced Research Program
                </Link>
              </li>
              <li>
                <Link href="/research" className="text-gray-300 hover:text-white transition-colors">
                  Browse All Syllabi
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Pathways */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student Pathways</p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/projects" className="text-gray-300 hover:text-white transition-colors">
                  Student Portfolios
                </Link>
              </li>
              <li>
                <Link href="/intern" className="text-gray-300 hover:text-white transition-colors">
                  Internship Fellowships
                </Link>
              </li>
              <li>
                <Link href="/success" className="text-gray-300 hover:text-white transition-colors">
                  Admissions Success
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
                  Research Insights & Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Admissions & Portal */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admissions & Portal</p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors">
                  Student / Parent Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-gray-300 hover:text-white transition-colors">
                  Create Applicant Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Applicant Portal
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Inquiry & Consultation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Office */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact & Office</p>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:support@cri.kr" className="hover:text-white transition-colors">
                  support@cri.kr
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="tel:02-6203-8999" className="hover:text-white transition-colors">
                  +82 02-6203-8999
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-gray-400 pt-1 leading-relaxed">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  53, Nonhyeon-ro 153-gil, Gangnam-gu, Seoul, Republic of Korea
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Accreditations */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex flex-wrap gap-4"><Link href="/admissions" className="underline">Application guide</Link><Link href="/privacy" className="underline">Privacy information</Link></div>
          <p>© 2026 CRI Global. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>The Academic Standard for Student Research</span>
            <span>Selective Admissions</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
