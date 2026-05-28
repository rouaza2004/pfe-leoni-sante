import { CalendarDays, Plus } from "lucide-react";

function HeroButton({ children, primary = false, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
        primary
          ? "bg-slate-950 text-white shadow-sm hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export default function ReportsHero({ onNewReport }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            Actions rapports
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Planifiez ou générez rapidement un rapport sans quitter l&apos;espace HSEE.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <HeroButton icon={<CalendarDays className="h-4 w-4" />}>Planifier</HeroButton>
          <HeroButton
            primary
            onClick={() => onNewReport(null)}
            icon={<Plus className="h-4 w-4" />}
          >
            Nouveau Rapport
          </HeroButton>
        </div>
      </div>
    </section>
  );
}
