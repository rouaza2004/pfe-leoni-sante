import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  SlidersHorizontal,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/api/api";

const statusOptions = [
  { id: "PREVU", label: "Confirmé" },
  { id: "REPORTE", label: "En attente" },
  { id: "ANNULE", label: "Annulé" },
  { id: "TERMINE", label: "Réalisé" },
];

const typeOptions = [
  {
    id: "periodique",
    label: "Périodique",
    keywords: ["periodique", "périodique", "annuel", "annuelle"],
  },
  {
    id: "previsite",
    label: "Pré-visite",
    keywords: ["pré-visite", "previsite", "prévisite"],
  },
  {
    id: "controle",
    label: "Contrôle",
    keywords: ["controle", "contrôle", "arrêt", "arret"],
  },
  { id: "suivi", label: "Suivi", keywords: ["suivi", "traitement"] },
  {
    id: "spontanee",
    label: "Spontanée",
    keywords: ["spontanée", "spontanee", "urgence"],
  },
];

const statusBadge = (statut) => {
  switch (statut) {
    case "TERMINE":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "ANNULE":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "EN_COURS":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "REPORTE":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "PREVU":
    default:
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
};

const typeBadgeClass = (value) => {
  if (!value) return "bg-slate-100 text-slate-700 border border-slate-200";
  if (String(value).toUpperCase().includes("TRAVAIL")) {
    return "bg-indigo-50 text-indigo-700 border border-indigo-200";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

const rdvStatusLabel = {
  PREVU: "Confirmé",
  TERMINE: "Réalisé",
  REPORTE: "En attente",
  ANNULE: "Annulé",
};

const toDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateParts = (value) => {
  if (!value) {
    return { weekday: "--", day: "--", month: "--" };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { weekday: "--", day: "--", month: "--" };
  }
  const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  const month = new Intl.DateTimeFormat("fr-FR", { month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  const day = new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(date);
  return { weekday, day, month };
};

export default function RDVMedTravailPage() {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get("/appointments/rdv/");
        if (cancelled) return;
        const all = Array.isArray(res.data) ? res.data : [];
        const travailOnly = all.filter(
          (item) =>
            item.type_medecin === "TRAVAIL" ||
            item.type_medecin === "MEDECIN_TRAVAIL"
        );
        setRdvs(travailOnly);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr("Impossible de charger les rendez-vous.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
        currentMonth
      ),
    [currentMonth]
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const nextDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [today]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const monthKey = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}`;

    return rdvs.filter((item) => {
      const dateKey = (item.date || "").slice(0, 7);
      if (dateKey && dateKey !== monthKey) return false;

      if (selectedStatuses.length > 0 && !selectedStatuses.includes(item.statut)) {
        return false;
      }

      if (selectedTypes.length > 0) {
        const motif = (item.motif || "").toLowerCase();
        const matchesType = selectedTypes.some((typeId) => {
          const option = typeOptions.find((t) => t.id === typeId);
          if (!option) return false;
          return option.keywords.some((kw) => motif.includes(kw));
        });
        if (!matchesType) return false;
      }

      if (q) {
        const target = [
          item.collaborateur_nom,
          item.collaborateur_prenom,
          item.matricule,
          item.motif,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return target.includes(q);
      }

      return true;
    });
  }, [rdvs, currentMonth, selectedStatuses, selectedTypes, search]);

  const upcomingSeven = useMemo(() => {
    const end = new Date(today);
    end.setDate(end.getDate() + 6);

    return filtered
      .filter((item) => {
        const d = toDate(item.date);
        if (!d) return false;
        d.setHours(0, 0, 0, 0);
        return d >= today && d <= end;
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [filtered, today]);

  const nextDaysCounts = useMemo(() => {
    const map = new Map();
    nextDays.forEach((d) => {
      map.set(d.toISOString().slice(0, 10), 0);
    });
    upcomingSeven.forEach((item) => {
      const key = (item.date || "").slice(0, 10);
      if (map.has(key)) {
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [nextDays, upcomingSeven]);

  const toggleType = (id) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleStatus = (id) => {
    setSelectedStatuses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const goMonth = (delta) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Gestion des Rendez-vous</h1>
        <p className="mt-2 text-sm text-slate-500">
          Planification des visites périodiques, contrôles et suivis médicaux.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Période
            </p>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-slate-900 capitalize">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => goMonth(1)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Types de visite
            </p>
            <div className="mt-3 space-y-2.5">
              {typeOptions.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(item.id)}
                    onChange={() => toggleType(item.id)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 transition focus:ring-2 focus:ring-slate-300"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Statut
            </p>
            <div className="mt-3 space-y-2.5">
              {statusOptions.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(item.id)}
                    onChange={() => toggleStatus(item.id)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 transition focus:ring-2 focus:ring-slate-300"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un rendez-vous..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition-all duration-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100"
              >
                <SlidersHorizontal size={16} />
                Filtres
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100"
              >
                <CalendarDays size={16} />
                Calendrier
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Calendrier</p>
                <p className="text-xs text-slate-500">Aperçu des 7 prochains jours</p>
              </div>
              <span className="text-xs text-slate-500">{monthLabel}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {nextDays.map((d) => {
                const key = d.toISOString().slice(0, 10);
                const count = nextDaysCounts.get(key) || 0;
                const isToday = key === today.toISOString().slice(0, 10);
                const hasRdv = count > 0;
                const label = new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
                  .format(d)
                  .replace(".", "")
                  .toUpperCase();
                return (
                  <div
                    key={key}
                    className={`rounded-2xl border px-3 py-2 text-center transition-all duration-200 hover:shadow-sm ${
                      isToday
                        ? "border-indigo-300 bg-indigo-50"
                        : hasRdv
                          ? "border-sky-200 bg-sky-50"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {label}
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{String(d.getDate()).padStart(2, "0")}</p>
                    <p
                      className={`text-xs font-medium ${
                        hasRdv ? "text-sky-700" : "text-slate-500"
                      }`}
                    >
                      {count} RDV
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          {loading ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-sm text-slate-500">
              Chargement des rendez-vous...
            </div>
          ) : upcomingSeven.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 text-sm text-slate-500">
              Aucun rendez-vous pour les 7 prochains jours.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSeven.map((item) => {
                const { weekday, day, month } = formatDateParts(item.date);
                const name = `${item.collaborateur_prenom || ""} ${
                  item.collaborateur_nom || ""
                }`.trim();
                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="grid items-center gap-4 lg:grid-cols-[90px_110px_minmax(0,1fr)_180px]">
                      <div className="w-[90px] min-w-[90px] shrink-0 place-self-center">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {weekday}
                          </p>
                          <p className="text-2xl font-semibold text-slate-900">{day}</p>
                          <p className="text-xs font-semibold text-slate-500">{month}</p>
                        </div>
                      </div>

                      <div className="w-[110px] min-w-[100px] shrink-0 place-self-center">
                        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-center shadow-sm">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700/70">
                            HEURE
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">
                            {(item.heure || "").slice(0, 5) || "--:--"}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {name || "Collaborateur"}
                            </p>
                            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                              {item.matricule || "—"}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${typeBadgeClass(
                                item.type_medecin
                              )}`}
                            >
                              {item.type_medecin || "TRAVAIL"}
                            </span>
                          </div>
                        <p className="text-sm text-slate-600 break-words">
                          {item.motif || "Visite médicale planifiée."}
                        </p>
                        </div>
                      </div>

                      <div className="flex h-full flex-col items-start justify-between gap-3 lg:items-end">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge(
                            item.statut
                          )}`}
                        >
                          {rdvStatusLabel[item.statut] || item.statut || "En attente"}
                        </span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 hover:shadow-sm"
                        >
                          <FileText size={14} />
                          Ouvrir dossier
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



