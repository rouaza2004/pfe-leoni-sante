export function StatsCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-slate-900">{value}</p>
          <p className="mt-1 text-[10px] text-slate-400">{subtitle}</p>
        </div>

        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </article>
  );
}

export default function ReportsStats({ items }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatsCard key={item.title} {...item} />
      ))}
    </section>
  );
}

