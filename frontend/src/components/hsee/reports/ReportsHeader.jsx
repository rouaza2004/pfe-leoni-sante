import { Bell, Search } from "lucide-react";

export default function ReportsHeader({ searchValue, onSearchChange, notificationCount = 0 }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Espace HSEE</p>
          <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
            Rapports HSEE
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Modèles, génération et suivi des rapports HSEE.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex h-10 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-slate-300 sm:w-[280px]">
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
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
