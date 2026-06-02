import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";

import { api } from "@/api/api";

const VISIT_TYPES = ["Périodique", "Pré-visite", "Contrôle", "Suivi", "Spontanée"];
const STATUS_TYPES = ["Confirmé", "En attente", "Annulé", "Réalisé"];

const statusTone = {
  "Confirmé": "bg-sky-50 text-sky-700 ring-sky-200",
  "En attente": "bg-amber-50 text-amber-700 ring-amber-200",
  "Annulé": "bg-rose-50 text-rose-700 ring-rose-200",
  "Réalisé": "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function formatMonth(date) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
}

function getDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function getNextSevenDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() + index);
    return day;
  });
}

function mapStatus(statut) {
  if (statut === "TERMINE") return "Réalisé";
  if (statut === "ANNULE") return "Annulé";
  if (statut === "REPORTE") return "En attente";
  return "Confirmé";
}

function inferVisitType(item) {
  const motif = (item?.motif || "").toLowerCase();

  if (motif.includes("périod") || motif.includes("period")) return "Périodique";
  if (motif.includes("pré") || motif.includes("pre-visite")) return "Pré-visite";
  if (motif.includes("suivi")) return "Suivi";
  if (motif.includes("spont")) return "Spontanée";
  if ((item?.type_medecin || "").toUpperCase() === "TRAVAIL") return "Périodique";
  if ((item?.type_medecin || "").toUpperCase() === "TRAITANT") return "Suivi";
  return "Contrôle";
}

function getCollaborateurName(item) {
  const fullName = `${item?.collaborateur_prenom || ""} ${item?.collaborateur_nom || ""}`.trim();
  return fullName || item?.matricule || "Collaborateur non renseigné";
}

function normalizeAppointment(item) {
  return {
    id: item.id,
    date: item.date || "",
    time: (item.heure || "").slice(0, 5),
    collaborateur: getCollaborateurName(item),
    visitType: inferVisitType(item),
    status: mapStatus(item.statut),
    notes: item.motif || "Aucune note",
  };
}

export default function RendezVousPage() {
  const [search, setSearch] = useState("");
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => getDayKey(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedVisitTypes, setSelectedVisitTypes] = useState(() =>
    Object.fromEntries(VISIT_TYPES.map((label) => [label, true]))
  );
  const [selectedStatuses, setSelectedStatuses] = useState(() =>
    Object.fromEntries(STATUS_TYPES.map((label) => [label, true]))
  );

  useEffect(() => {
    let cancelled = false;

    const loadAppointments = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await api.get("/appointments/rdv/");
        if (cancelled) return;

        const payload = Array.isArray(response.data) ? response.data : [];
        setAppointments(payload.map(normalizeAppointment));
      } catch (error) {
        console.error("Erreur chargement rendez-vous", {
          endpoint: "/api/appointments/rdv/",
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
        if (!cancelled) {
          setErrorMessage("Impossible de charger les rendez-vous.");
          setAppointments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, []);

  const nextSevenDays = useMemo(() => getNextSevenDays(), []);

  const filteredAppointments = useMemo(() => {
    const month = activeMonth.getMonth();
    const year = activeMonth.getFullYear();
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      if (!appointment.date) return false;

      const dateValue = new Date(appointment.date);
      if (Number.isNaN(dateValue.getTime())) return false;

      if (dateValue.getMonth() !== month || dateValue.getFullYear() !== year) return false;
      if (!selectedVisitTypes[appointment.visitType]) return false;
      if (!selectedStatuses[appointment.status]) return false;

      if (!query) return true;

      return [
        appointment.collaborateur,
        appointment.visitType,
        appointment.status,
        appointment.notes,
        appointment.time,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [activeMonth, appointments, search, selectedStatuses, selectedVisitTypes]);

  const appointmentsByDay = useMemo(() => {
    return filteredAppointments.reduce((acc, appointment) => {
      if (!appointment.date) return acc;
      if (!acc[appointment.date]) acc[appointment.date] = [];
      acc[appointment.date].push(appointment);
      return acc;
    }, {});
  }, [filteredAppointments]);

  const sevenDayAppointments = useMemo(() => {
    const dayKeys = new Set(nextSevenDays.map((day) => getDayKey(day)));
    return filteredAppointments.filter((item) => dayKeys.has(item.date));
  }, [filteredAppointments, nextSevenDays]);

  const selectedDayAppointments = useMemo(() => {
    return appointmentsByDay[selectedDay] || [];
  }, [appointmentsByDay, selectedDay]);

  const monthLabel = useMemo(() => {
    const label = formatMonth(activeMonth);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [activeMonth]);

  const changeMonth = (offset) => {
    setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const toggleVisitType = (label) => {
    setSelectedVisitTypes((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleStatus = (label) => {
    setSelectedStatuses((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-sky-50/35 to-white p-6 shadow-sm shadow-slate-200/50">
        <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
          Gestion des Rendez-vous
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Planification des visites périodiques, contrôles et suivis médicaux.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Période
              </p>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50/50 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="rounded-xl p-2 text-sky-700 transition hover:bg-white hover:text-slate-900"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft size={16} />
                </button>
                <p className="text-sm font-semibold text-slate-900">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="rounded-xl p-2 text-sky-700 transition hover:bg-white hover:text-slate-900"
                  aria-label="Mois suivant"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Types de visite
              </p>
              <div className="mt-3 space-y-2.5">
                {VISIT_TYPES.map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1 text-sm text-slate-700 transition hover:bg-sky-50/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVisitTypes[label]}
                      onChange={() => toggleVisitType(label)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-sky-300"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Statut
              </p>
              <div className="mt-3 space-y-2.5">
                {STATUS_TYPES.map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1 text-sm text-slate-700 transition hover:bg-sky-50/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses[label]}
                      onChange={() => toggleStatus(label)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-sky-300"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="flex h-11 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-200/40 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                <Search size={16} className="text-sky-500" />
                <input
                  type="text"
                  placeholder="Rechercher un rendez-vous..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>

              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
              >
                <Filter size={16} />
                Filtres
              </button>

              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
              >
                <CalendarRange size={16} />
                Calendrier
              </button>
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900">Calendrier</h2>
              <p className="mt-1 text-xs text-slate-500">Aperçu des 7 prochains jours</p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {nextSevenDays.map((date) => {
                const key = getDayKey(date);
                const count = (appointmentsByDay[key] || []).length;
                const isSelected = selectedDay === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-sky-50/40 text-slate-700 hover:border-sky-300"
                    }`}
                  >
                    <p
                      className={`text-[11px] uppercase tracking-[0.18em] ${
                        isSelected ? "text-slate-200" : "text-slate-400"
                      }`}
                    >
                      {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </p>
                    <p className="mt-1 text-2xl font-semibold leading-none">
                      {date.toLocaleDateString("fr-FR", { day: "2-digit" })}
                    </p>
                    <p className={`mt-2 text-xs ${isSelected ? "text-slate-200" : "text-slate-500"}`}>
                      {count} RDV
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              {!errorMessage && !isLoading && sevenDayAppointments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-sky-50/40 px-4 py-3 text-sm text-slate-600">
                  Aucun rendez-vous pour les 7 prochains jours.
                </div>
              ) : null}

              {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-sky-50/40 px-4 py-3 text-sm text-slate-600">
                  Chargement des rendez-vous...
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700">
                <CalendarDays size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Rendez-vous du jour sélectionné</h3>
                <p className="text-xs text-slate-500">
                  {new Date(selectedDay).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {selectedDayAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-5 text-sm text-slate-600">
                Aucun rendez-vous pour cette date.
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayAppointments.map((appointment) => (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-sky-100 bg-sky-50/40 px-4 py-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {appointment.collaborateur}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {appointment.time || "--:--"} ”¢ {appointment.visitType}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{appointment.notes}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                          statusTone[appointment.status] || "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}


