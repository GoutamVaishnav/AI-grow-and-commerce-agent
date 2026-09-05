export default function AIReadinessScore({ score, checks, warnings }) {
  return (
    <div className="bg-white border rounded-md p-6 max-w-lg">
      <p className="text-sm text-gray-500">AI-Ready Catalog Score</p>
      <p className="text-4xl font-bold text-flip-green">{score} / 100</p>
      <p className="text-xs text-gray-400 mt-1 mb-4">
        This score measures how easily AI buyers can understand and transact with your catalog.
      </p>

      <div className="flex flex-col gap-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-sm">
            <span className="text-flip-green">✓</span>
            <span>{c.label}</span>
          </div>
        ))}
        {warnings.map((w) => (
          <div key={w} className="flex items-center gap-2 text-sm text-amber-600">
            <span>⚠</span>
            <span>{w}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
