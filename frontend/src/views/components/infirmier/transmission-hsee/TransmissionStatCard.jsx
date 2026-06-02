export default function TransmissionStatCard({ title, value, hint, icon: Icon, tone }) {
  return (
    <article className={`rounded-2xl border p-2.5 shadow-sm ${tone.card}`}>
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-slate-950">{value}</p>
          <p className="mt-1 text-[10px] text-slate-400">{hint}</p>
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone.icon}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </article>
  );
}

