import {
  AlertTriangle,
  ArrowRight,
  CircleCheckBig,
  PenSquare,
  ShieldAlert,
} from "lucide-react";
import RiskBadge from "./RiskBadge";

function meterTone(levelKey) {
  if (levelKey === "critique") return "bg-rose-500";
  if (levelKey === "eleve") return "bg-orange-500";
  if (levelKey === "moyen") return "bg-amber-400";
  return "bg-emerald-500";
}

function RiskMeter({ label, value, levelKey }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}/5</p>
      </div>
      <div className="mt-3 flex gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={`${label}-${index}`}
            className={`h-2.5 flex-1 rounded-full ${
              index < value ? meterTone(levelKey) : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function RiskLevelIndicator({ levelKey }) {
  const styles = {
    critique: "bg-rose-100 text-rose-700",
    eleve: "bg-orange-100 text-orange-700",
    moyen: "bg-amber-100 text-amber-700",
    faible: "bg-emerald-100 text-emerald-700",
  };

  const Icon = levelKey === "faible" ? CircleCheckBig : ShieldAlert;

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles[levelKey] || styles.faible}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

export default function RiskCard({ risk }) {
  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
            <RiskLevelIndicator levelKey={risk.level.key} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                      {risk.title}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-slate-500">
                      {risk.code}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <RiskBadge tone={risk.level.key}>{risk.level.label}</RiskBadge>
                <RiskBadge tone={risk.status.key}>{risk.status.label}</RiskBadge>
                <RiskBadge>{risk.category}</RiskBadge>
                <RiskBadge>{risk.department}</RiskBadge>
              </div>

              <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-600">
                {risk.description}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_180px]">
            <RiskMeter label="Probabilité" value={risk.probability} levelKey={risk.level.key} />
            <RiskMeter label="Gravité" value={risk.severity} levelKey={risk.level.key} />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Criticité</p>
              <div
                className={`mt-4 inline-flex min-w-24 items-center justify-center rounded-2xl px-4 py-3 text-2xl font-bold ${
                  risk.level.key === "critique"
                    ? "bg-rose-500 text-white"
                    : risk.level.key === "eleve"
                    ? "bg-orange-500 text-white"
                    : risk.level.key === "moyen"
                    ? "bg-amber-400 text-slate-950"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {risk.criticality}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-slate-500" />
              <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Mesures préventives
              </h4>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {risk.preventiveMeasures.map((measure) => (
                <div
                  key={`${risk.id}-${measure}`}
                  className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm ring-1 ring-slate-200/80"
                >
                  {measure}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-[24px] bg-slate-950 px-5 py-4 text-white lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-3 text-sm md:grid-cols-2 md:gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Responsable</p>
                <p className="mt-1 font-medium">{risk.responsible}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Échéance</p>
                <p className="mt-1 font-medium">{risk.dueDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 xl:w-36">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Détails
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Modifier
            <PenSquare className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
