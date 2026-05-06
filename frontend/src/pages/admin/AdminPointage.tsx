import { useMemo, useState } from "react";
import { CalendarDays, Clock3, TriangleAlert, UserCheck, UserX } from "lucide-react";

type PointageStatus = "Présent" | "Retard" | "Absent";

type PointageRow = {
  id: string;
  nom: string;
  heureEntree: string;
  heureSortie: string;
  statut: PointageStatus;
  date: string;
};

const initialPointages: PointageRow[] = [
  {
    id: "emp-1",
    nom: "Ahmed Benali",
    heureEntree: "07:58",
    heureSortie: "16:32",
    statut: "Présent",
    date: "2026-04-13",
  },
  {
    id: "emp-2",
    nom: "Sara Mansouri",
    heureEntree: "08:17",
    heureSortie: "16:40",
    statut: "Retard",
    date: "2026-04-13",
  },
  {
    id: "emp-3",
    nom: "Karim Ait",
    heureEntree: "08:02",
    heureSortie: "16:24",
    statut: "Présent",
    date: "2026-04-13",
  },
  {
    id: "emp-4",
    nom: "Fatima Zohra",
    heureEntree: "—",
    heureSortie: "—",
    statut: "Absent",
    date: "2026-04-13",
  },
  {
    id: "emp-5",
    nom: "Amal Souissi",
    heureEntree: "08:25",
    heureSortie: "16:11",
    statut: "Retard",
    date: "2026-04-13",
  },
  {
    id: "emp-6",
    nom: "Youssef Lamrani",
    heureEntree: "07:51",
    heureSortie: "16:08",
    statut: "Présent",
    date: "2026-04-13",
  },
];

const statusStyles: Record<PointageStatus, string> = {
  Présent: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Retard: "bg-amber-50 text-amber-700 ring-amber-200",
  Absent: "bg-rose-50 text-rose-700 ring-rose-200",
};

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  iconStyle,
}: {
  title: string;
  value: number;
  detail: string;
  icon: typeof UserCheck;
  iconStyle: string;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            iconStyle,
          ].join(" ")}
        >
          <Icon size={22} />
        </div>
      </div>
    </article>
  );
}

export default function AdminPointage() {
  const [selectedDate, setSelectedDate] = useState("2026-04-13");

  const filteredRows = useMemo(
    () => initialPointages.filter((row) => row.date === selectedDate),
    [selectedDate]
  );

  const stats = useMemo(() => {
    const presents = filteredRows.filter((row) => row.statut === "Présent").length;
    const retards = filteredRows.filter((row) => row.statut === "Retard").length;
    const absents = filteredRows.filter((row) => row.statut === "Absent").length;

    return [
      {
        title: "Présents",
        value: presents,
        detail: `${filteredRows.length} employé(s) suivis`,
        icon: UserCheck,
        iconStyle: "bg-emerald-100 text-emerald-700",
      },
      {
        title: "Retards",
        value: retards,
        detail: "Arrivées après l'heure prévue",
        icon: TriangleAlert,
        iconStyle: "bg-amber-100 text-amber-700",
      },
      {
        title: "Absents",
        value: absents,
        detail: "Aucun pointage enregistré",
        icon: UserX,
        iconStyle: "bg-rose-100 text-rose-700",
      },
      {
        title: "Date filtrée",
        value: filteredRows.length,
        detail: selectedDate,
        icon: CalendarDays,
        iconStyle: "bg-sky-100 text-sky-700",
      },
    ];
  }, [filteredRows, selectedDate]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            Pointage Administration
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Suivi global des pointages des employés
          </p>
        </div>

        <label className="w-full lg:w-auto">
          <span className="mb-2 block text-sm font-medium text-slate-700">Date</span>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            />
            <CalendarDays
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </label>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((item) => (
          <SummaryCard key={item.title} {...item} />
        ))}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Pointages du jour</h2>
            <p className="mt-1 text-sm text-slate-500">
              Vue administrative consolidée des entrées et sorties.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-500 sm:flex">
            <Clock3 size={16} />
            Mise à jour locale
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/90">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Nom
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Heure entrée
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Heure sortie
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Statut
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredRows.map((row) => (
                <tr key={row.id} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.nom}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.heureEntree}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.heureSortie}</td>
                  <td className="px-6 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1",
                        statusStyles[row.statut],
                      ].join(" ")}
                    >
                      {row.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">Aucun pointage trouvé</p>
            <p className="mt-1 text-sm text-slate-500">
              Aucun employé n&apos;a de pointage pour la date sélectionnée.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
