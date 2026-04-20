import { Bell, Search } from "lucide-react";

export default function ReportsHeader({ searchValue, onSearchChange, notificationCount = 0 }) {
  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          Rapports
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">mardi 14 avril 2026</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100/70 sm:w-[320px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <button
          type="button"
          className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
            {notificationCount}
          </span>
        </button>
      </div>
    </section>
  );
}
