export default function RevenueCard({ label, value, accent, suffix }) {
  return (
    <div className="bg-white border rounded-md p-4 flex flex-col gap-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${accent || "text-gray-900"}`}>
        {value}
        {suffix && <span className="text-sm font-medium ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
