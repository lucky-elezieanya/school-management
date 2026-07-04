/* =========================================================
    INFO CARD
========================================================= */
export function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100">
      <div className="flex items-center gap-2 text-emerald-800 mb-2">
        {icon}

        <p className="text-sm font-medium">{label}</p>
      </div>

      <p className="text-gray-800 font-semibold text-lg break-words">
        {value || "N/A"}
      </p>
    </div>
  );
}

/* =========================================================
    STAT CARD
========================================================= */
export function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-3xl p-6 shadow-lg">
      <p className="text-emerald-100 text-sm">{title}</p>

      <h3 className="text-4xl font-bold mt-3">{value}</h3>
    </div>
  );
}
