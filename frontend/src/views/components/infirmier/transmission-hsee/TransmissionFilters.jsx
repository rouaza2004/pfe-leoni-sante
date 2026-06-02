import { CalendarDays, Search } from "lucide-react";

export default function TransmissionFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  site,
  onSiteChange,
  date,
  onDateChange,
  statusOptions,
  siteOptions,
}) {
  return (
    <section className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <label className="flex h-10 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-slate-300">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher par référence, site, responsable..."
            className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-slate-300"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={site}
          onChange={(event) => onSiteChange(event.target.value)}
          className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition focus:border-slate-300"
        >
          {siteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="flex h-10 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="bg-transparent text-[13px] text-slate-700 outline-none"
          />
        </label>
      </div>
    </section>
  );
}

