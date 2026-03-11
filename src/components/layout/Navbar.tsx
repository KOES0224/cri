"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, ArrowRight, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navTextClass = isHome && !scrolled 
    ? "text-gray-200 hover:text-white" 
    : "text-gray-600 hover:text-black";
  
  const logoClass = isHome && !scrolled
    ? "text-white"
    : "bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600";

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "py-4" : "py-6"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between rounded-2xl px-6 py-3 transition-colors duration-300 ${scrolled ? "bg-white/70 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl" : "bg-transparent"}`}>
          
          <div className="flex items-center">
            <Link href="/" className={`text-2xl font-black tracking-tighter ${logoClass}`}>
              CRI.
            </Link>
            
            <div className="hidden lg:flex items-center ml-12 space-x-6">
              <Link href="/research" className={`text-sm font-semibold transition-colors ${navTextClass}`}>
                Research
              </Link>
              <Link href="/projects" className={`text-sm font-semibold transition-colors ${navTextClass}`}>
                Projects
              </Link>
              <Link href="/intern" className={`text-sm font-semibold transition-colors ${navTextClass}`}>
                Intern
              </Link>
              <Link href="/success" className={`text-sm font-semibold transition-colors whitespace-nowrap ${navTextClass}`}>
                Student Success
              </Link>
              <Link href="/blog" className={`text-sm font-semibold transition-colors ${navTextClass}`}>
                Blog
              </Link>
              <Link href="/contact" className={`text-sm font-semibold transition-colors ${navTextClass}`}>
                Contact
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-3 bg-gray-50/80 backdrop-blur-md rounded-full p-1 pr-4 border border-gray-200">
                <Link href="/dashboard" className="flex items-center justify-center h-8 w-8 rounded-full bg-white shadow-sm border border-gray-100 text-blue-600 hover-lift click-press">
                  <UserCircle className="w-5 h-5" />
                </Link>
                <Link href="/dashboard" className="text-sm font-semibold text-gray-700 hover:text-black transition-colors">
                  Dashboard
                </Link>
                <div className="w-px h-4 bg-gray-300 mx-2"></div>
                <button onClick={() => signOut()} className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors click-press">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login" className="text-sm font-semibold text-gray-600 hover:text-black transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/login" className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-black rounded-full overflow-hidden hover-lift click-press">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative flex items-center">
                    Portal <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -mr-2 text-gray-600 hover:text-black focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full px-4 mt-2">
          <div className="p-4 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl flex flex-col space-y-3">
            <Link href="/research" className="text-sm font-semibold text-gray-800 p-2 rounded-lg hover:bg-gray-50">Research</Link>
            <Link href="/projects" className="text-sm font-semibold text-gray-800 p-2 rounded-lg hover:bg-gray-50">Projects</Link>
            <Link href="/intern" className="text-sm font-semibold text-gray-800 p-2 rounded-lg hover:bg-gray-50">Intern</Link>
            <Link href="/success" className="text-sm font-semibold text-gray-800 p-2 rounded-lg hover:bg-gray-50">Student Success</Link>
            <Link href="/blog" className="text-sm font-semibold text-gray-800 p-2 rounded-lg hover:bg-gray-50">Blog</Link>
            <Link href="/contact" className="text-sm font-semibold text-gray-800 p-2 rounded-lg hover:bg-gray-50">Contact</Link>
            <div className="h-px bg-gray-100 my-2"></div>
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-semibold text-blue-600 p-2 rounded-lg bg-blue-50/50 hover:bg-blue-50">Dashboard</Link>
                <button onClick={() => signOut()} className="text-left text-sm font-semibold text-red-600 p-2 rounded-lg hover:bg-red-50">Sign out</button>
              </>
            ) : (
              <Link href="/auth/login" className="flex items-center justify-center p-3 text-sm font-semibold text-white bg-black rounded-xl">
                Access Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
