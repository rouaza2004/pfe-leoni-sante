export default function RiskSummaryCard({
  label,
  value,
  accentClass,
  hint,
  icon: Icon,
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{hint}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
