/** Skeleton for the program detail page so the click responds immediately. */
export default function ProgramLoading() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32" aria-busy="true">
      <div className="max-w-7xl mx-auto px-6 animate-pulse">
        <div className="h-4 w-36 rounded bg-gray-200 mb-10" />
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-2"><div className="h-6 w-32 rounded-full bg-gray-200" /><div className="h-6 w-48 rounded-full bg-gray-100" /></div>
            <div className="h-14 w-5/6 rounded-xl bg-gray-200" />
            <div className="h-14 w-2/3 rounded-xl bg-gray-200" />
            <div className="h-24 w-full rounded-xl bg-gray-100" />
            <div className="grid sm:grid-cols-3 gap-4 pt-4">{[0, 1, 2].map((i) => <div key={i} className="h-36 rounded-2xl bg-white border border-gray-100" />)}</div>
            <div className="h-80 w-full rounded-3xl bg-white border border-gray-100" />
          </div>
          <div className="space-y-4">
            <div className="h-[520px] rounded-3xl bg-white border border-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
