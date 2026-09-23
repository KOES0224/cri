/** Instant feedback for client-side navigations while a dynamic page renders. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6" aria-busy="true" aria-live="polite">
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="h-4 w-32 rounded bg-gray-200 mb-10" />
        <div className="h-12 w-2/3 max-w-xl rounded-xl bg-gray-200 mb-4" />
        <div className="h-5 w-1/2 max-w-md rounded bg-gray-100 mb-12" />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 rounded-3xl border border-gray-100 bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
