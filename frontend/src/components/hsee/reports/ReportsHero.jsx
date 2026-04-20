import { CalendarDays, Plus } from "lucide-react";

function HeroButton({ children, primary = false, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition ${
        primary
          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
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
    <section className="rounded-[30px] border border-sky-100 bg-gradient-to-r from-sky-50 via-blue-50 to-slate-50 p-6 shadow-sm shadow-sky-100/70 sm:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
            Rapports HSEE
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Génération et consultation des rapports de suivi HSEE
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
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
