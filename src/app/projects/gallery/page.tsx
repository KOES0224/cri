import Link from 'next/link';
export const metadata = { title: 'Student Project Gallery | CRI' };
export default function GalleryPage() {
  return <div className="min-h-[70vh] pt-36 pb-24 px-6"><div className="max-w-5xl mx-auto">
    <Link href="/projects" className="text-blue-700 underline">Back to Projects</Link>
    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mt-8">Student Project Gallery</h1>
    <p className="text-lg text-gray-600 mt-5">Student-authored research and projects from the CRI community.</p>
    <div className="border border-gray-200 rounded-3xl bg-gray-50 p-8 sm:p-12 mt-10">
      <h2 className="text-2xl font-bold text-gray-900">Gallery updates are on the way</h2>
      <p className="text-gray-600 mt-3">Projects will appear here as they are prepared for publication.</p>
      <Link href="/contact" className="inline-block text-blue-700 underline mt-5">Contact CRI about student projects</Link>
    </div>
  </div></div>;
}
