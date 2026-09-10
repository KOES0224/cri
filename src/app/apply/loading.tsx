export default function ApplyLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto animate-pulse">
        {/* Back Link Skeleton */}
        <div className="h-4 w-36 bg-gray-200 rounded-md mb-8"></div>

        {/* Progress Bar Skeleton */}
        <div className="mb-8 flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
          <div className="relative z-10 w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center font-bold text-sm text-transparent">1</div>
          <div className="relative z-10 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm text-transparent">2</div>
          <div className="relative z-10 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm text-transparent">3</div>
          <div className="relative z-10 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm text-transparent">4</div>
        </div>

        {/* Main Card Skeleton */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100 space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-3 pb-6 border-b border-gray-100">
            <div className="h-8 w-64 bg-gray-200 rounded-xl"></div>
            <div className="h-4 w-96 max-w-full bg-gray-100 rounded-lg"></div>
          </div>

          {/* Form Fields Grid Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
              <div className="h-12 w-full bg-gray-100 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
              <div className="h-12 w-full bg-gray-100 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-12 w-full bg-gray-100 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-12 w-full bg-gray-100 rounded-xl"></div>
            </div>
          </div>

          {/* Larger Field Skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-4 w-40 bg-gray-200 rounded"></div>
            <div className="h-12 w-full bg-gray-100 rounded-xl"></div>
          </div>

          {/* Bottom Button Skeleton */}
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <div className="h-13 w-36 bg-blue-600/20 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
