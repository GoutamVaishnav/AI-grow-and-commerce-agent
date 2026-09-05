export default function AIActivityTimeline({ entries }) {
  if (!entries.length) {
    return <p className="text-sm text-gray-400">No AI activity yet — try the AI Shopping assistant.</p>;
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry, i) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                entry.status === "SUCCESS" ? "bg-flip-green" : "bg-red-500"
              }`}
            />
            {i < entries.length - 1 && <span className="w-px flex-1 bg-gray-200" />}
          </div>
          <div className="pb-5 flex-1">
            <p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleTimeString("en-IN")}</p>
            <p className="text-sm font-medium">{entry.customerMessage ? `Customer asked: "${entry.customerMessage}"` : entry.action}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-semibold text-gray-600">Action:</span> {entry.action}
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-600">Reason:</span> {entry.reason}
            </p>
            {entry.result && (
              <p className="text-xs text-gray-500 truncate max-w-md">
                <span className="font-semibold text-gray-600">Result:</span> {JSON.stringify(entry.result)}
              </p>
            )}
            {entry.revenueImpact > 0 && (
              <p className="text-xs text-purple-600 font-medium">
                Additional Revenue: ₹{entry.revenueImpact.toLocaleString("en-IN")}
              </p>
            )}
            <span
              className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                entry.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {entry.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
