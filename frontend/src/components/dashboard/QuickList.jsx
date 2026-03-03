const badgeStyle = (badge) => {
  const b = (badge || "").toLowerCase();
  if (b.includes("urgent")) return "bg-red-100 text-red-700 border-red-200";
  if (b.includes("aujourd")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (b.includes("demain")) return "bg-amber-100 text-amber-800 border-amber-200";
  if (b.includes("à faire")) return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

export default function QuickList({ items = [] }) {
  return (
    <div className="space-y-4">
      {items.map((it) => (
        <div key={it.id} className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{it.title}</p>
            {it.sub && <p className="text-sm text-slate-500">{it.sub}</p>}
          </div>

          {it.badge ? (
            <span className={`text-xs px-3 py-1 rounded-full border ${badgeStyle(it.badge)}`}>
              {it.badge}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}