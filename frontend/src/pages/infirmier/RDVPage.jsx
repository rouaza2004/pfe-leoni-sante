import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Edit3,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/api/api";
import { SITE_FILTER_OPTIONS, getSiteName, matchesSiteFilter } from "@/utils/siteOptions";

const visitTypes = [
  { value: "VISITE_PERIODIQUE", label: "Visite périodique" },
  { value: "VISITE_EMBAUCHE", label: "Visite d'embauche" },
  { value: "CONTROLE", label: "Contrôle" },
  { value: "SUIVI", label: "Suivi médical" },
  { value: "URGENCE", label: "Urgence" },
];

const statusOptions = [
  { value: "PREVU", label: "Planifié" },
  { value: "TERMINE", label: "Confirmé" },
  { value: "ANNULE", label: "Annulé" },
];

const smsStatusLabel = {
  ENVOYE: "Envoyé",
  EN_ATTENTE: "En attente",
  ECHEC: "Échec",
};

const medecinTypeLabel = {
  TRAITANT: "Médecin traitant",
  TRAVAIL: "Médecin du travail",
  CONTROLEUR: "Médecin contrôleur",
};

const emptyForm = {
  collaborateur: "",
  medecin: "",
  type_medecin: "TRAITANT",
  date: "",
  heure: "",
  type_visite: "VISITE_PERIODIQUE",
  statut: "PREVU",
  smsReminder: false,
  notes: "",
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getCollaborateurName = (item) =>
  [item.collaborateur_prenom, item.collaborateur_nom].filter(Boolean).join(" ").trim();

const getMedecinName = (item) => item.medecin_nom || "-";

const getVisitTypeLabel = (value) =>
  visitTypes.find((type) => type.value === value)?.label || value || "Visite périodique";

const getStatusLabel = (value) =>
  statusOptions.find((status) => status.value === value)?.label ||
  (value === "REPORTE" ? "Reporté" : value || "Planifié");

const statusBadgeClass = (statut) => {
  switch (statut) {
    case "TERMINE":
      return "border-green-200 bg-green-50 text-green-700";
    case "ANNULE":
      return "border-red-200 bg-red-50 text-red-700";
    case "REPORTE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "PREVU":
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
};

const smsBadgeClass = (status) => {
  switch (status) {
    case "ENVOYE":
      return "border-green-200 bg-green-50 text-green-700";
    case "ECHEC":
      return "border-red-200 bg-red-50 text-red-700";
    case "EN_ATTENTE":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
};

const buildMotif = ({ type_visite, notes }) => {
  const typeLabel = getVisitTypeLabel(type_visite);
  const cleanNotes = notes.trim();
  return cleanNotes ? `${typeLabel} - ${cleanNotes}` : typeLabel;
};

const extractVisitType = (motif) => {
  const text = normalize(motif);
  const found = visitTypes.find((type) => {
    const label = normalize(type.label);
    return text.includes(label) || text.includes(normalize(type.value));
  });
  return found?.value || "VISITE_PERIODIQUE";
};

const extractNotes = (motif) => {
  const value = String(motif || "");
  const separatorIndex = value.indexOf(" - ");
  if (separatorIndex >= 0) return value.slice(separatorIndex + 3);

  const type = visitTypes.find((item) => normalize(item.label) === normalize(value));
  return type ? "" : value;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatCalendarDate = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR").format(date);
};

export default function RDVPage() {
  const [rdvs, setRdvs] = useState([]);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [filters, setFilters] = useState({
    date: "",
    medecin: "",
    collaborateur: "",
    statut: "",
    site: "all",
  });
  const [collabSearch, setCollabSearch] = useState("");
  const [matchedCollab, setMatchedCollab] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [smsStatuses, setSmsStatuses] = useState({});
  const [smsLoadingId, setSmsLoadingId] = useState(null);
  const [smsSuccessMessage, setSmsSuccessMessage] = useState("");
  const [smsErrorMessage, setSmsErrorMessage] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");

      const [rdvRes, collabRes, medRes] = await Promise.all([
        api.get("/appointments/rdv/"),
        api.get("/medical/collaborateurs/"),
        api.get("/medecins/"),
      ]);

      setRdvs(Array.isArray(rdvRes.data) ? rdvRes.data : []);
      setCollaborateurs(Array.isArray(collabRes.data) ? collabRes.data : []);
      setMedecins(Array.isArray(medRes.data) ? medRes.data : []);
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 403) {
        setErr("Accès refusé à certaines données nécessaires aux rendez-vous.");
      } else {
        setErr("Impossible de charger les rendez-vous. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCollaborateurs = useMemo(() => {
    const q = normalize(collabSearch);
    if (!q) return collaborateurs.slice(0, 8);
    return collaborateurs
      .filter((c) =>
        [c.matricule, c.nom, c.prenom].filter(Boolean).join(" ").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [collaborateurs, collabSearch]);

  const filteredRdvs = useMemo(() => {
    const collaboratorQuery = normalize(filters.collaborateur);

    return rdvs.filter((item) => {
      if (filters.date && item.date !== filters.date) return false;
      if (filters.medecin && String(item.medecin || "") !== filters.medecin) return false;
      if (filters.statut && item.statut !== filters.statut) return false;
      if (!matchesSiteFilter(item.site_nom, filters.site)) return false;

      if (collaboratorQuery) {
        const target = [
          getCollaborateurName(item),
          item.collaborateur_nom,
          item.collaborateur_prenom,
          item.matricule,
          item.site_nom,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return target.includes(collaboratorQuery);
      }

      return true;
    });
  }, [rdvs, filters]);

  const groupedByDay = useMemo(() => {
    const map = new Map();

    filteredRdvs
      .slice()
      .sort((a, b) => `${a.date || ""} ${a.heure || ""}`.localeCompare(`${b.date || ""} ${b.heure || ""}`))
      .forEach((item) => {
        const key = item.date || "Sans date";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
      });

    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [filteredRdvs]);

  const getCollaborateurForRdv = useCallback(
    (item) =>
      collaborateurs.find(
        (collaborateur) =>
          String(collaborateur.id) === String(item.collaborateur) ||
          normalize(collaborateur.matricule) === normalize(item.matricule)
      ),
    [collaborateurs]
  );

  const getCollaborateurPhone = useCallback((item) => {
    const collaborateur = getCollaborateurForRdv(item);
    return (
      item.telephone ||
      item.phone ||
      item.gsm ||
      collaborateur?.telephone ||
      collaborateur?.phone ||
      collaborateur?.gsm ||
      ""
    );
  }, [getCollaborateurForRdv]);

  const getCollaborateurSite = useCallback(
    (item) => {
      const collaborateur = getCollaborateurForRdv(item);
      return getSiteName(item.site_nom || collaborateur?.site);
    },
    [getCollaborateurForRdv]
  );

  const getDefaultSmsStatus = useCallback((item) => {
    if (!getCollaborateurPhone(item)) return "ECHEC";
    if (item.statut === "TERMINE") return "ENVOYE";
    return "EN_ATTENTE";
  }, [getCollaborateurPhone]);

  const smsRows = useMemo(
    () =>
      filteredRdvs
        .slice()
        .sort((a, b) =>
          `${a.date || ""} ${a.heure || ""}`.localeCompare(
            `${b.date || ""} ${b.heure || ""}`
          )
        )
        .map((item) => ({
          ...item,
          phone: getCollaborateurPhone(item),
          smsStatus: smsStatuses[item.id] || getDefaultSmsStatus(item),
        })),
    [filteredRdvs, getCollaborateurPhone, getDefaultSmsStatus, smsStatuses]
  );

  const selectedCollabHint = useMemo(() => {
    if (matchedCollab) {
      return `${matchedCollab.prenom || ""} ${matchedCollab.nom || ""}`.trim();
    }
    if (collabSearch) return "Matricule introuvable.";
    return "Saisir ou sélectionner un matricule.";
  }, [matchedCollab, collabSearch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ date: "", medecin: "", collaborateur: "", statut: "", site: "all" });
  };

  const selectCollaborateur = (collaborateur) => {
    setMatchedCollab(collaborateur);
    setCollabSearch(collaborateur.matricule || "");
    setForm((prev) => ({ ...prev, collaborateur: String(collaborateur.id) }));
  };

  const handleMatriculeChange = (e) => {
    const value = e.target.value;
    setCollabSearch(value);

    const found = collaborateurs.find(
      (c) => normalize(c.matricule) === normalize(value)
    );

    setMatchedCollab(found || null);
    setForm((prev) => ({ ...prev, collaborateur: found ? String(found.id) : "" }));
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setCollabSearch("");
    setMatchedCollab(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    const collab = collaborateurs.find((c) => String(c.id) === String(item.collaborateur));
    setEditingId(item.id);
    setForm({
      collaborateur: item.collaborateur ? String(item.collaborateur) : "",
      medecin: item.medecin ? String(item.medecin) : "",
      type_medecin: item.type_medecin || "TRAITANT",
      date: item.date || "",
      heure: (item.heure || "").slice(0, 5),
      type_visite: extractVisitType(item.motif),
      statut: ["PREVU", "TERMINE", "ANNULE"].includes(item.statut) ? item.statut : "PREVU",
      smsReminder: false,
      notes: extractNotes(item.motif),
    });
    setMatchedCollab(collab || null);
    setCollabSearch(item.matricule || collab?.matricule || "");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setErr("");

      const payload = {
        collaborateur: Number(form.collaborateur),
        medecin: form.medecin ? Number(form.medecin) : null,
        type_medecin: form.type_medecin,
        date: form.date,
        heure: form.heure,
        motif: buildMotif(form),
        statut: form.statut,
      };

      if (editingId) {
        await api.put(`/appointments/rdv/${editingId}/`, payload);
      } else {
        await api.post("/appointments/rdv/", payload);
      }

      resetForm();
      await loadData();
    } catch (e) {
      console.error(e);
      setErr("Impossible d'enregistrer ce rendez-vous. Vérifiez les champs saisis.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const name = getCollaborateurName(item) || item.matricule || "ce rendez-vous";
    if (!window.confirm(`Supprimer le rendez-vous de ${name} ?`)) return;

    try {
      setDeletingId(item.id);
      setErr("");
      await api.delete(`/appointments/rdv/${item.id}/`);
      setRdvs((prev) => prev.filter((rdv) => rdv.id !== item.id));
    } catch (e) {
      console.error(e);
      setErr("Impossible de supprimer ce rendez-vous.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendSms = async (item) => {
    const phone = getCollaborateurPhone(item);
    if (!phone) return;

    try {
      setSmsLoadingId(item.id);
      setSmsSuccessMessage("");
      setSmsErrorMessage("");

      await api.post("/sms/test", {
        phone,
        message: "Bonjour, votre tour approche, veuillez vous rendre a l'infirmerie",
      });

      setSmsStatuses((prev) => ({ ...prev, [item.id]: "ENVOYE" }));
      setSmsSuccessMessage("SMS envoy? avec succ?s.");
    } catch (e) {
      console.error(e);
      setSmsStatuses((prev) => ({ ...prev, [item.id]: "ECHEC" }));
      setSmsErrorMessage("Erreur lors de l'envoi du SMS.");
    } finally {
      setSmsLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Module Infirmier</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Gestion des rendez-vous
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Planification et suivi des visites médicales des collaborateurs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Fermer" : "Ajouter RDV"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {showForm && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Renseigner le collaborateur, le médecin, la date et les informations de visite.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Collaborateur
              </label>
              <input
                type="text"
                placeholder="Matricule collaborateur"
                value={collabSearch}
                onChange={handleMatriculeChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
              <div className="mt-2 text-sm text-slate-600">{selectedCollabHint}</div>
              {collabSearch && filteredCollaborateurs.length > 0 && !matchedCollab && (
                <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  {filteredCollaborateurs.map((collaborateur) => (
                    <button
                      key={collaborateur.id}
                      type="button"
                      onClick={() => selectCollaborateur(collaborateur)}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span className="font-medium">{collaborateur.matricule}</span>
                      {" - "}
                      {[collaborateur.prenom, collaborateur.nom].filter(Boolean).join(" ")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Type de médecin
              </label>
              <select
                name="type_medecin"
                value={form.type_medecin}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                <option value="TRAITANT">Médecin traitant</option>
                <option value="TRAVAIL">Médecin du travail</option>
                <option value="CONTROLEUR">Médecin contrôleur</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Médecin
              </label>
              <select
                name="medecin"
                value={form.medecin}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                <option value="">Sélectionner un médecin</option>
                {medecins.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.username || `Médecin ${m.id}`} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Heure</label>
              <input
                type="time"
                name="heure"
                value={form.heure}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Type de visite
              </label>
              <select
                name="type_visite"
                value={form.type_visite}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                {visitTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Statut</label>
              <select
                name="statut"
                value={form.statut}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="smsReminder"
                  checked={form.smsReminder}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                />
                Envoyer un rappel SMS au collaborateur
              </label>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Informations complémentaires, consignes ou observations..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 md:col-span-2 xl:col-span-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || !form.collaborateur}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">Filtres</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Affiner la liste par date, médecin, collaborateur ou statut.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          />
          <select
            name="medecin"
            value={filters.medecin}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          >
            <option value="">Tous les médecins</option>
            {medecins.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name || m.username || `Médecin ${m.id}`}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              name="collaborateur"
              placeholder="Collaborateur ou matricule"
              value={filters.collaborateur}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-900"
            />
          </div>
          <select
            name="statut"
            value={filters.statut}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          >
            <option value="">Tous les statuts</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <select
            name="site"
            value={filters.site}
            onChange={handleFilterChange}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
          >
            {SITE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-slate-500" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Calendrier des visites
              </h2>
              <p className="text-sm text-slate-500">
                Rendez-vous regroupés par date
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Chargement du calendrier...
            </div>
          ) : groupedByDay.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Aucun rendez-vous programmé
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByDay.map((group) => (
                <div
                  key={group.date}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Date: {formatCalendarDate(group.date)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {group.items.length} rendez-vous
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {group.items.length} RDV
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 text-sm text-slate-700">
                            <span className="font-bold text-slate-900">
                              {(item.heure || "").slice(0, 5) || "--:--"}
                            </span>
                            <span className="text-slate-400"> | </span>
                            <span className="font-medium text-slate-900">
                              {getCollaborateurName(item) || "Collaborateur"}
                            </span>
                            <span className="text-slate-400"> | </span>
                            <span>{getMedecinName(item)}</span>
                          </div>
                          <span
                            className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass(
                              item.statut
                            )}`}
                          >
                            {getStatusLabel(item.statut)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-900">Liste des rendez-vous</h2>
            <p className="text-sm text-slate-500">
              {filteredRdvs.length} rendez-vous affiché{filteredRdvs.length > 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Chargement des rendez-vous...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Nom collaborateur</th>
                    <th className="px-3 py-3 font-medium">Site</th>
                    <th className="px-3 py-3 font-medium">Médecin</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Heure</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Statut</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRdvs.length > 0 ? (
                    filteredRdvs.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">
                            {getCollaborateurName(item) || "Collaborateur"}
                          </p>
                          <p className="text-xs text-slate-500">{item.matricule || "-"}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{getCollaborateurSite(item)}</td>
                        <td className="px-3 py-3 text-slate-700">
                          <p>{getMedecinName(item)}</p>
                          <p className="text-xs text-slate-500">
                            {medecinTypeLabel[item.type_medecin] || item.type_medecin || "-"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{formatDate(item.date)}</td>
                        <td className="px-3 py-3 text-slate-700">
                          {(item.heure || "").slice(0, 5) || "-"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {getVisitTypeLabel(extractVisitType(item.motif))}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass(
                              item.statut
                            )}`}
                          >
                            {getStatusLabel(item.statut)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              title="Modifier"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-3 py-12 text-center text-slate-500">
                        Aucun rendez-vous programmé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Suivi des notifications SMS
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Contrôle visuel des rappels SMS associés aux rendez-vous affichés.
          </p>
        </div>

        {smsSuccessMessage && (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {smsSuccessMessage}
          </div>
        )}

        {smsErrorMessage && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {smsErrorMessage}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Chargement du suivi SMS...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Collaborateur</th>
                  <th className="px-3 py-3 font-medium">Site</th>
                  <th className="px-3 py-3 font-medium">Numéro téléphone</th>
                  <th className="px-3 py-3 font-medium">Date rendez-vous</th>
                  <th className="px-3 py-3 font-medium">Médecin</th>
                  <th className="px-3 py-3 font-medium">Statut SMS</th>
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {smsRows.length > 0 ? (
                  smsRows.map((item) => {
                    const hasPhone = Boolean(item.phone);
                    return (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">
                            {getCollaborateurName(item) || "Collaborateur"}
                          </p>
                          <p className="text-xs text-slate-500">{item.matricule || "-"}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{getCollaborateurSite(item)}</td>
                        <td className="px-3 py-3 text-slate-700">
                          {item.phone || "Numéro indisponible"}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          <p>{formatDate(item.date)}</p>
                          <p className="text-xs text-slate-500">
                            {(item.heure || "").slice(0, 5) || "-"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{getMedecinName(item)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${smsBadgeClass(
                              item.smsStatus
                            )}`}
                          >
                            {smsStatusLabel[item.smsStatus] || "En attente"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end">
                            {!hasPhone ? (
                              <button
                                type="button"
                                disabled
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400"
                              >
                                Numéro indisponible
                              </button>
                            ) : item.smsStatus === "ENVOYE" ? (
                              <button
                                type="button"
                                disabled
                                className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700"
                              >
                                Envoyé
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendSms(item)}
                                disabled={smsLoadingId === item.id}
                                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {smsLoadingId === item.id
                                  ? "Envoi..."
                                  : item.smsStatus === "ECHEC"
                                  ? "Relancer"
                                  : "Envoyer SMS"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-10 text-center text-slate-500">
                      Aucun rendez-vous programmé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
