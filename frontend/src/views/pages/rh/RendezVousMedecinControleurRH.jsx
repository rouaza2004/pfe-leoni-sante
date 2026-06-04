import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, Filter, Pencil, Plus, Search, X } from "lucide-react";

import { api } from "@/api/api";

const statusOptions = [
  { value: "", label: "Tous les statuts" },
  { value: "PREVU", label: "Planifie" },
  { value: "REPORTE", label: "Reporte" },
  { value: "TERMINE", label: "Termine" },
  { value: "ANNULE", label: "Annule" },
];

const emptyForm = {
  collaborateur: "",
  medecin: "",
  date: "",
  heure: "",
  motif: "",
  statut: "PREVU",
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isUpcomingControllerAppointment(item) {
  return (
    item.type_medecin === "CONTROLEUR" &&
    String(item.date || "") >= todayIso() &&
    !["ANNULE", "TERMINE"].includes(item.statut)
  );
}

function getCollaborateurName(item) {
  return [item.collaborateur_prenom, item.collaborateur_nom].filter(Boolean).join(" ").trim();
}

function getCollaborateurOptionLabel(item) {
  const name = [item.prenom, item.nom].filter(Boolean).join(" ").trim() || "Collaborateur";
  return `${item.matricule || "N/A"} - ${name}`;
}

function getDoctorName(item) {
  return item.full_name || item.username || `Medecin ${item.id}`;
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function statusLabel(value) {
  return statusOptions.find((item) => item.value === value)?.label || value || "Planifie";
}

function statusClass(value) {
  switch (value) {
    case "TERMINE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ANNULE":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "REPORTE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function EmptyState({ loading }) {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-5 text-sm text-slate-600">
      {loading ? "Chargement des rendez-vous..." : "Aucun rendez-vous médecin contrôleur disponible."}
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function RendezVousMedecinControleurRH() {
  const [appointments, setAppointments] = useState([]);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [filters, setFilters] = useState({ search: "", date: "", status: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [appointmentRes, collabRes, medecinRes] = await Promise.all([
        api.get("/appointments/rdv/"),
        api.get("/collaborateurs/"),
        api.get("/medecins/"),
      ]);
      setAppointments(Array.isArray(appointmentRes.data) ? appointmentRes.data : []);
      setCollaborateurs(Array.isArray(collabRes.data) ? collabRes.data : []);
      setMedecins(Array.isArray(medecinRes.data) ? medecinRes.data : []);
    } catch (err) {
      console.error("Erreur chargement rendez-vous medecin controleur RH", err);
      setError("Impossible de charger les rendez-vous médecin contrôleur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const controllerDoctors = useMemo(
    () => medecins.filter((item) => String(item.role || "").toUpperCase() === "MEDECIN_CONTROLEUR"),
    [medecins]
  );

  const controllerAppointments = useMemo(
    () => appointments.filter((item) => item.type_medecin === "CONTROLEUR"),
    [appointments]
  );

  const upcomingAppointments = useMemo(
    () =>
      controllerAppointments
        .filter(isUpcomingControllerAppointment)
        .sort((a, b) => `${a.date || ""} ${a.heure || ""}`.localeCompare(`${b.date || ""} ${b.heure || ""}`)),
    [controllerAppointments]
  );

  const kpis = useMemo(
    () => ({
      upcoming: upcomingAppointments.length,
      today: upcomingAppointments.filter((item) => item.date === todayIso()).length,
      completed: controllerAppointments.filter((item) => item.statut === "TERMINE").length,
      cancelled: controllerAppointments.filter((item) => item.statut === "ANNULE").length,
    }),
    [controllerAppointments, upcomingAppointments]
  );

  const filteredAppointments = useMemo(() => {
    const search = normalize(filters.search);
    return upcomingAppointments.filter((item) => {
      if (filters.date && item.date !== filters.date) return false;
      if (filters.status && item.statut !== filters.status) return false;
      if (search) {
        const target = [getCollaborateurName(item), item.matricule, item.motif, item.medecin_nom]
          .filter(Boolean)
          .join(" ");
        if (!normalize(target).includes(search)) return false;
      }
      return true;
    });
  }, [filters, upcomingAppointments]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback("");
    setError("");

    const payload = {
      collaborateur: form.collaborateur,
      medecin: form.medecin,
      type_medecin: "CONTROLEUR",
      date: form.date,
      heure: form.heure,
      motif: form.motif || "Rendez-vous médecin contrôleur",
      statut: form.statut || "PREVU",
    };

    try {
      if (editingId) {
        await api.patch(`/appointments/rdv/${editingId}/`, payload);
      } else {
        await api.post("/appointments/rdv/", payload);
      }
      setFeedback(editingId ? "Rendez-vous médecin contrôleur modifié avec succès." : "Rendez-vous médecin contrôleur créé avec succès.");
      resetForm();
      await loadData();
    } catch (err) {
      console.error("Erreur enregistrement rendez-vous controleur RH", err);
      setError("Impossible d'enregistrer le rendez-vous médecin contrôleur.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(null);
    setEditingId(appointment.id);
    setForm({
      collaborateur: appointment.collaborateur || "",
      medecin: appointment.medecin || "",
      date: appointment.date || "",
      heure: formatTime(appointment.heure),
      motif: appointment.motif || "",
      statut: appointment.statut || "PREVU",
    });
    setShowForm(true);
  };

  const handleCancel = async (appointment) => {
    try {
      setCancellingId(appointment.id);
      setFeedback("");
      setError("");
      await api.patch(`/appointments/rdv/${appointment.id}/`, {
        collaborateur: appointment.collaborateur,
        medecin: appointment.medecin,
        type_medecin: "CONTROLEUR",
        date: appointment.date,
        heure: appointment.heure,
        motif: appointment.motif || "Rendez-vous médecin contrôleur",
        statut: "ANNULE",
      });
      setFeedback("Rendez-vous médecin contrôleur annulé avec succès.");
      await loadData();
    } catch (err) {
      console.error("Erreur annulation rendez-vous controleur RH", err);
      setError("Impossible d'annuler le rendez-vous médecin contrôleur.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-500 ring-1 ring-slate-200">
              <CalendarDays size={14} className="text-slate-700" />
              Rendez-vous RH
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">LEONI</p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
                Rendez-vous Médecin Contrôleur
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600">
                Planification et consultation des rendez-vous chez le médecin contrôleur.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setEditingId(null);
                setForm(emptyForm);
                setShowForm(true);
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-200/60 transition hover:bg-sky-700"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Fermer" : "Nouveau rendez-vous"}
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <KpiCard label="RDV à venir" value={kpis.upcoming} />
        <KpiCard label="RDV aujourd'hui" value={kpis.today} />
        <KpiCard label="RDV terminés" value={kpis.completed} />
        <KpiCard label="RDV annulés" value={kpis.cancelled} />
      </section>

      {showForm ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-6">
            <label className="space-y-1 text-xs font-medium text-slate-600 lg:col-span-2">
              Collaborateur
              <select
                required
                value={form.collaborateur}
                onChange={(event) => setForm((current) => ({ ...current, collaborateur: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
              >
                <option value="">Sélectionner</option>
                {collaborateurs.map((item) => (
                  <option key={item.id} value={item.id}>
                    {getCollaborateurOptionLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600 lg:col-span-2">
              Médecin contrôleur
              <select
                required
                value={form.medecin}
                onChange={(event) => setForm((current) => ({ ...current, medecin: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
              >
                <option value="">Sélectionner</option>
                {controllerDoctors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {getDoctorName(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600">
              Date
              <input
                required
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600">
              Heure
              <input
                required
                type="time"
                value={form.heure}
                onChange={(event) => setForm((current) => ({ ...current, heure: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600 lg:col-span-4">
              Motif
              <input
                value={form.motif}
                onChange={(event) => setForm((current) => ({ ...current, motif: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
                placeholder="Motif du rendez-vous"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600">
              Statut
              <select
                value={form.statut}
                onChange={(event) => setForm((current) => ({ ...current, statut: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
              >
                {statusOptions.filter((item) => item.value).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                <CalendarDays size={16} />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Filter size={16} />
          Filtres
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Recherche
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <Search size={15} className="text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
                placeholder="Collaborateur ou matricule"
              />
            </div>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Date rendez-vous
            <input
              type="date"
              value={filters.date}
              onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Statut
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
            >
              {statusOptions.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {feedback ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {selectedAppointment ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {getCollaborateurName(selectedAppointment) || "Collaborateur non renseigné"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {selectedAppointment.matricule || "N/A"} - {formatDate(selectedAppointment.date)} à {formatTime(selectedAppointment.heure)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {selectedAppointment.medecin_nom || "Médecin contrôleur non renseigné"} - {selectedAppointment.motif || "--"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAppointment(null)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <X size={14} />
              Fermer
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarDays size={16} />
          Rendez-vous planifiés
        </div>
        {filteredAppointments.length === 0 ? (
          <EmptyState loading={loading} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-3">Collaborateur</th>
                  <th className="px-3 py-3">Matricule</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Heure</th>
                  <th className="px-3 py-3">Médecin contrôleur</th>
                  <th className="px-3 py-3">Motif</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-slate-100 text-sm text-slate-700">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {getCollaborateurName(appointment) || "Collaborateur non renseigné"}
                    </td>
                    <td className="px-3 py-3">{appointment.matricule || "N/A"}</td>
                    <td className="px-3 py-3">{formatDate(appointment.date)}</td>
                    <td className="px-3 py-3">{formatTime(appointment.heure)}</td>
                    <td className="px-3 py-3">{appointment.medecin_nom || "--"}</td>
                    <td className="px-3 py-3">{appointment.motif || "--"}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(appointment.statut)}`}>
                        {statusLabel(appointment.statut)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAppointment(appointment)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye size={14} />
                          Consulter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(appointment)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(appointment)}
                          disabled={cancellingId === appointment.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          <X size={14} />
                          Annuler
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
