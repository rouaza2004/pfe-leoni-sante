import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  FileText,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { api } from "@/controllers/api/api";

const BACKEND_URL = "http://127.0.0.1:8000";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
};

const aptitudeLabel = (value) => {
  switch (value) {
    case "APTE":
      return "Apte";
    case "APTE_AMENAGEMENT":
      return "Apte avec aménagement";
    case "INAPTE_TEMPORAIRE":
      return "Inapte temporaire";
    case "APTE_APRES_CHANGEMENT":
      return "Apte après changement du poste";
    case "INAPTE_DEFINITIF":
      return "Inapte définitif";
    default:
      return value || "-";
  }
};

const examenLabel = (value) => {
  switch (value) {
    case "EMBAUCHE":
      return "Embauche";
    case "PERIODIQUE":
      return "Périodique";
    case "REPRISE":
      return "Reprise";
    case "SPONTANE":
      return "Spontané";
    default:
      return value || "-";
  }
};

const aptitudeBadge = (value) => {
  switch (value) {
    case "APTE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "APTE_AMENAGEMENT":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "INAPTE_TEMPORAIRE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "INAPTE_DEFINITIF":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "APTE_APRES_CHANGEMENT":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

const Field = ({ label, value, className = "" }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] ${className}`}>
    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
      {label}
    </p>
    <p className="text-[13px] font-semibold text-slate-900 mt-1 whitespace-nowrap">{value}</p>
  </div>
);

export default function FichesAptitudePage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [fiches, setFiches] = useState([]);

  const [typeFilter, setTypeFilter] = useState("");
  const [aptitudeFilter, setAptitudeFilter] = useState("");
  const [matriculeFilter, setMatriculeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [collabs, setCollabs] = useState([]);
  const [collabSearch, setCollabSearch] = useState("");
  const [collabLoading, setCollabLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await api.get("/medical/fiches-aptitude/");
        setFiches(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger les fiches d’aptitude.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!showCreate || collabs.length > 0) return;

    const load = async () => {
      try {
        setCollabLoading(true);
        const res = await api.get("/collaborateurs/");
        setCollabs(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger la liste des collaborateurs.");
      } finally {
        setCollabLoading(false);
      }
    };

    load();
  }, [showCreate, collabs.length]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const matricule = matriculeFilter.toLowerCase().trim();

    return fiches
      .filter((f) => {
        const text = `
          ${f.collaborateur_nom || ""}
          ${f.collaborateur_prenom || ""}
          ${f.matricule || ""}
          ${f.type_examen || ""}
          ${f.aptitude || ""}
        `.toLowerCase();

        if (q && !text.includes(q)) return false;
        if (matricule && !(f.matricule || "").toLowerCase().includes(matricule)) return false;
        if (typeFilter && f.type_examen !== typeFilter) return false;
        if (aptitudeFilter && f.aptitude !== aptitudeFilter) return false;

        const current = new Date(f.date_examen || f.date || f.created_at || "");
        if (dateFrom) {
          const from = new Date(dateFrom);
          if (current < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (current > to) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
      );
  }, [aptitudeFilter, dateFrom, dateTo, fiches, matriculeFilter, search, typeFilter]);

  const hasActiveFilters =
    search || matriculeFilter || typeFilter || aptitudeFilter || dateFrom || dateTo;

  const handleOpenPdf = async (ficheId) => {
    try {
      const token = localStorage.getItem("access");

      if (!token) {
        setErr("Utilisateur non authentifié.");
        return;
      }

      const res = await api.get(`/medical/fiche-aptitude/${ficheId}/pdf/`, {
        responseType: "blob",
      });

      const blob = res.data;
      const fileURL = window.URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
    } catch (e) {
      console.error(e);
      if (e?.response?.status === 401) {
        setErr("Session expirée. Veuillez vous reconnecter.");
      } else {
        setErr("Erreur lors de l’ouverture du PDF.");
      }
    }
  };

  const handleDelete = async (ficheId) => {
    const ok = window.confirm("Supprimer cette fiche d’aptitude ?");
    if (!ok) return;

    try {
      await api.delete(`/medical/fiches-aptitude/${ficheId}/`);
      setFiches((prev) => prev.filter((f) => f.id !== ficheId));
    } catch (e) {
      console.error(e);
      setErr("Impossible de supprimer la fiche d’aptitude.");
    }
  };

  const filteredCollabs = useMemo(() => {
    const q = collabSearch.toLowerCase().trim();
    if (!q) return collabs.slice(0, 20);
    return collabs.filter((c) => {
      const text = `${c.nom || ""} ${c.prenom || ""} ${c.matricule || ""}`
        .toLowerCase()
        .trim();
      return text.includes(q);
    });
  }, [collabSearch, collabs]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-slate-500">
          Chargement des fiches d’aptitude...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-slate-500">Médecin du travail</p>
            <h1 className="text-[28px] font-bold text-slate-900 mt-1">
              Fiches d’aptitude
            </h1>
            <p className="text-slate-500 mt-2">
              Consulter et gérer les fiches d’aptitude enregistrées.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              <Plus size={16} />
              Créer une fiche d’aptitude
            </button>
            <div className="h-11 w-11 rounded-2xl bg-slate-50 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-slate-700" />
            </div>
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {err}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 flex-1 min-w-[220px] max-w-[480px]">
            <Search size={18} className="text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, aptitude..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none w-full bg-transparent text-sm"
            />
          </div>

          <input
            type="text"
            placeholder="Matricule"
            value={matriculeFilter}
            onChange={(e) => setMatriculeFilter(e.target.value)}
            className="h-10 rounded-full border border-slate-200 px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white min-w-[120px]"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-full border border-slate-200 px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white min-w-[120px]"
          >
            <option value="">Type d?examen</option>
            <option value="EMBAUCHE">Embauche</option>
            <option value="PERIODIQUE">P?riodique</option>
            <option value="REPRISE">Reprise</option>
            <option value="SPONTANE">Spontan?</option>
          </select>
          <select
            value={aptitudeFilter}
            onChange={(e) => setAptitudeFilter(e.target.value)}
            className="h-10 rounded-full border border-slate-200 px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white min-w-[120px]"
          >
            <option value="">Aptitude</option>
            <option value="APTE">Apte</option>
            <option value="APTE_AMENAGEMENT">Apte avec am?nagement</option>
            <option value="INAPTE_TEMPORAIRE">Inapte temporaire</option>
            <option value="APTE_APRES_CHANGEMENT">Apte apr?s changement</option>
            <option value="INAPTE_DEFINITIF">Inapte d?finitif</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 rounded-full border border-slate-200 px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white min-w-[120px]"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 rounded-full border border-slate-200 px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white min-w-[120px]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-slate-500">
          {hasActiveFilters
            ? "Aucun résultat ne correspond à vos filtres."
            : "Aucune fiche d’aptitude trouvée."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((fiche) => (
            <div
              key={fiche.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 transition hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap xl:flex-col xl:items-start">
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900">
                      {`${fiche.collaborateur_nom || ""} ${fiche.collaborateur_prenom || ""}`.trim() || "-"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Matricule : {fiche.matricule || "-"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full border text-[11px] font-semibold ${aptitudeBadge(
                      fiche.aptitude
                    )}`}
                  >
                    {aptitudeLabel(fiche.aptitude)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Type examen" value={examenLabel(fiche.type_examen)} className="min-w-[120px]" />
                  <Field label="Aptitude" value={aptitudeLabel(fiche.aptitude)} className="min-w-[110px]" />
                  <Field label="Date" value={formatDate(fiche.date_examen || fiche.date)} className="min-w-[130px]" />
                  <Field
                    label="Collaborateur"
                    value={
                      `${fiche.collaborateur_nom || ""} ${fiche.collaborateur_prenom || ""}`.trim() ||
                      "-"
                    }
                    className="min-w-[150px]"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-start xl:justify-end xl:col-span-2 mt-1">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/medecin-travail/collaborateurs/${fiche.collaborateur}`)
                    }
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Ouvrir dossier
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPdf(fiche.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    <FileText size={16} />
                    Ouvrir PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPdf(fiche.id)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Régénérer PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(fiche.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 text-rose-600 px-4 py-2 text-sm font-medium hover:bg-rose-50 transition"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>

              {fiche.recommandations ? (
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Recommandations
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {fiche.recommandations}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Créer une fiche d’aptitude
                </h3>
                <p className="text-sm text-slate-500">
                  Sélectionnez le collaborateur concerné.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Search size={18} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou matricule..."
                  value={collabSearch}
                  onChange={(e) => setCollabSearch(e.target.value)}
                  className="outline-none w-full bg-transparent text-sm"
                />
              </div>

              {collabLoading ? (
                <div className="text-sm text-slate-500">
                  Chargement des collaborateurs...
                </div>
              ) : filteredCollabs.length === 0 ? (
                <div className="text-sm text-slate-500">
                  Aucun collaborateur trouvé.
                </div>
              ) : (
                <div className="max-h-72 overflow-auto space-y-2">
                  {filteredCollabs.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {`${c.nom || ""} ${c.prenom || ""}`.trim() || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Matricule : {c.matricule || "-"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/medecin-travail/collaborateurs/${c.id}/fiche-aptitude`)
                        }
                        className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:opacity-90 transition"
                      >
                        Créer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

