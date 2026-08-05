import SchoolDaysCard from "@/app/components/sections/SchoolDaysCard";

export default function SchoolDaysPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Academic Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage school operational data for the current term
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Grid (you can add more cards later) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* School Days Card */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <SchoolDaysCard />
          </div>
        </div>
      </div>
    </div>
  );
}
