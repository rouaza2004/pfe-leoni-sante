export function StatsCard({ title, value, subtitle, icon: Icon, tone }) {
  return (
    <article
      className={`rounded-[26px] border p-5 shadow-sm ${tone.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">{subtitle}</p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

export default function ReportsStats({ items }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatsCard key={item.title} {...item} />
      ))}
    </section>
  );
}
