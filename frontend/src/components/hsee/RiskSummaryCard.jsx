export default function RiskSummaryCard({
  label,
  value,
  accentClass,
  hint,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-slate-900">{value}</p>
          <p className="mt-1 text-[10px] text-slate-400">{hint}</p>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
