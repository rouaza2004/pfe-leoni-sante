import { CalendarDays, Clock3 } from "lucide-react";

export default function AdminMetierHeader({
  title = "Bonsoir, admin",
  subtitle,
  appointmentsCount = 0,
  dateLabel,
}) {
  return (
    <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          <CalendarDays size={14} />
          {dateLabel}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white ring-1 ring-slate-800">
          <Clock3 size={14} />
          {appointmentsCount} rendez-vous planifiés
        </span>
      </div>

      <div className="mt-5">
        <h1 className="text-[30px] font-semibold tracking-tight text-slate-900 sm:text-[34px]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">{subtitle}</p>
      </div>
    </section>
  );
}

