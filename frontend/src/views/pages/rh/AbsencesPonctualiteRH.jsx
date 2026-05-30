import {
  AlarmClock,
  BadgeAlert,
  BriefcaseBusiness,
  CalendarRange,
  Search,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

const summaryData = [
  {
    title: "Total retards",
    value: "128",
    detail: "+12 ce mois-ci",
    icon: <AlarmClock size={18} />,
    tone: "warning",
  },
  {
    title: "Total absences",
    value: "47",
    detail: "8 non justifiées",
    icon: <BadgeAlert size={18} />,
    tone: "danger",
  },
  {
    title: "Congés maladie",
    value: "19",
    detail: "6 en cours",
    icon: <CalendarRange size={18} />,
    tone: "info",
  },
];

const departmentStats = [
  { name: "Production", retards: 34, absences: 11, maladie: 7 },
  { name: "Qualité", retards: 18, absences: 9, maladie: 4 },
  { name: "Maintenance", retards: 22, absences: 8, maladie: 3 },
  { name: "Logistique", retards: 27, absences: 10, maladie: 3 },
  { name: "Admin", retards: 12, absences: 9, maladie: 2 },
];

const collaborateurRows = [
  {
    matricule: "LEO-1042",
    nom: "Sonia Ben Salem",
    departement: "Production",
    retards: 6,
    absences: 1,
    maladie: 0,
    statut: "Actif",
    statutTone: "success",
  },
  {
    matricule: "LEO-1178",
    nom: "Walid Mansouri",
    departement: "Maintenance",
    retards: 3,
    absences: 0,
    maladie: 1,
    statut: "Congé maladie",
    statutTone: "info",
  },
  {
    matricule: "LEO-0882",
    nom: "Asma Jlassi",
    departement: "Qualité",
    retards: 7,
    absences: 2,
    maladie: 0,
    statut: "Actif",
    statutTone: "success",
  },
  {
    matricule: "LEO-1544",
    nom: "Karim Trabelsi",
    departement: "Logistique",
    retards: 4,
    absences: 3,
    maladie: 2,
    statut: "À surveiller",
    statutTone: "warning",
  },
  {
    matricule: "LEO-0935",
    nom: "Nadia Chatti",
    departement: "Admin",
    retards: 1,
    absences: 0,
    maladie: 4,
    statut: "Congé maladie",
    statutTone: "info",
  },
  {
    matricule: "LEO-1320",
    nom: "Hatem Gharbi",
    departement: "Production",
    retards: 9,
    absences: 4,
    maladie: 0,
    statut: "À surveiller",
    statutTone: "danger",
  },
];

const toneClasses = {
  info: {
    icon: "border-sky-200 bg-sky-50 text-sky-700",
    value: "text-sky-700",
    pill: "border-sky-200 bg-sky-50 text-sky-700",
  },
  success: {
    icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
    value: "text-emerald-700",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  warning: {
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    value: "text-amber-700",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  danger: {
    icon: "border-rose-200 bg-rose-50 text-rose-700",
    value: "text-rose-700",
    pill: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

function SummaryCard({ title, value, detail, icon, tone }) {
  const toneClass = toneClasses[tone] || toneClasses.info;

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className={`mt-2 text-[28px] font-semibold tracking-tight ${toneClass.value}`}>
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${toneClass.icon}`}
        >
          {icon}
        </div>
      </div>
    </article>
  );
}

function StatusPill({ label, tone }) {
  const toneClass = toneClasses[tone] || toneClasses.info;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClass.pill}`}
    >
      {label}
    </span>
  );
}

function GroupedBarChart() {
  const maxValue = Math.max(
    ...departmentStats.flatMap((item) => [item.retards, item.absences, item.maladie]),
    1
  );

  const series = [
    { key: "retards", label: "Retards", color: "bg-sky-500" },
    { key: "absences", label: "Absences", color: "bg-rose-400" },
    { key: "maladie", label: "Congés maladie", color: "bg-amber-400" },
  ];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Statistiques par département</h3>
          <p className="mt-1 text-xs text-slate-500">
            Vue comparative des retards, absences et congés maladie.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {series.map((item) => (
            <span
              key={item.key}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-600"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-5 gap-5">
          {departmentStats.map((department) => (
            <div key={department.name} className="flex flex-col items-center">
              <div className="flex h-[260px] w-full items-end justify-center gap-2 rounded-[24px] bg-slate-50 px-3 pb-4 pt-6 ring-1 ring-slate-100">
                {series.map((serie) => {
                  const value = department[serie.key];
                  const height = Math.max((value / maxValue) * 190, 12);

                  return (
                    <div key={serie.key} className="flex w-full flex-col items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-500">{value}</span>
                      <div
                        className={`w-full rounded-t-[14px] ${serie.color} shadow-sm`}
                        style={{ height: `${height}px` }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">{department.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AbsencesPonctualiteRH() {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return collaborateurRows;

    return collaborateurRows.filter((item) =>
      [item.matricule, item.nom, item.departement, item.statut]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search]);

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                <BriefcaseBusiness size={14} className="text-slate-700" />
                RH Analytics
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 font-medium text-white">
                <TrendingUp size={14} />
                Suivi mensuel
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                LEONI
              </p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
                Absences, Congés maladie & Ponctualité
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600">
                Suivi détaillé par collaborateur et département.
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-[380px] items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/40">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un collaborateur ou matricule..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryData.map((item) => (
          <SummaryCard key={item.title} {...item} />
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <GroupedBarChart />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Détail par collaborateur</h2>
            <p className="mt-1 text-xs text-slate-500">
              Vue synthétique des retards, absences et congés maladie.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[880px] overflow-hidden rounded-[24px] border border-slate-200">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Département</th>
                  <th className="px-4 py-3">Retards</th>
                  <th className="px-4 py-3">Absences</th>
                  <th className="px-4 py-3">Congés maladie</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr
                    key={row.matricule}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.matricule}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.nom}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.departement}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-amber-700">{row.retards}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-rose-600">{row.absences}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-sky-700">{row.maladie}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusPill label={row.statut} tone={row.statutTone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 ? (
            <div className="mt-4 rounded-[22px] border border-dashed border-sky-200 bg-sky-50/40 px-4 py-5 text-sm text-slate-600">
              Aucun collaborateur ne correspond à la recherche.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

