import { Atom, BookOpen, Compass, GraduationCap, Landmark, PenLine, Trophy, Users, type LucideIcon } from "lucide-react";
import type { BlogCategory } from "@/lib/blog-categories";

// Stand-in artwork for posts without a photo: a category-coloured panel instead of an empty grey box.
const STYLES: Record<BlogCategory, { icon: LucideIcon; className: string }> = {
  "Programs & Faculty": { icon: GraduationCap, className: "from-blue-600 to-indigo-700" },
  "Admissions Insights": { icon: Landmark, className: "from-slate-700 to-slate-900" },
  "Research & Writing": { icon: PenLine, className: "from-emerald-600 to-teal-700" },
  "Competitions & Activities": { icon: Trophy, className: "from-amber-500 to-orange-600" },
  "Majors & Careers": { icon: Compass, className: "from-violet-600 to-purple-700" },
  "Inside CRI": { icon: Users, className: "from-sky-500 to-blue-600" },
  "Science & Discovery": { icon: Atom, className: "from-cyan-600 to-teal-800" },
};

export default function EditorialCover({ category, size = "card" }: { category: string; size?: "card" | "hero" }) {
  const style = STYLES[category as BlogCategory] ?? { icon: BookOpen, className: "from-gray-600 to-gray-800" };
  const Icon = style.icon;
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${style.className} flex items-center justify-center overflow-hidden`} aria-hidden="true">
      <Icon className={`absolute -right-6 -bottom-6 text-white/10 ${size === "hero" ? "w-72 h-72" : "w-40 h-40"}`} strokeWidth={1.25} />
      <div className="flex flex-col items-center gap-3 text-white/90">
        <Icon className={size === "hero" ? "w-14 h-14" : "w-10 h-10"} strokeWidth={1.5} />
        <span className="text-xs font-bold uppercase tracking-[0.2em]">{category}</span>
      </div>
    </div>
  );
}
