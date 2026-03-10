import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Search, FileText } from "lucide-react";
import { api } from "@/api/api";

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

export default function FichesAptitudePage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [fiches, setFiches] = useState([]);

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return fiches
      .filter((f) => {
        const text = `
          ${f.collaborateur_nom || ""}
          ${f.collaborateur_prenom || ""}
          ${f.matricule || ""}
          ${f.type_examen || ""}
          ${f.aptitude || ""}
        `.toLowerCase();

        return text.includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
      );
  }, [fiches, search]);

  const handleOpenPdf = async (ficheId) => {
    try {
      const token = localStorage.getItem("access");

      if (!token) {
        setErr("Utilisateur non authentifié.");
        return;
      }

      const res = await fetch(
        `${BACKEND_URL}/api/medical/fiche-aptitude/${ficheId}/pdf/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Erreur ouverture PDF");
      }

      const blob = await res.blob();
      const fileURL = window.URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
    } catch (e) {
      console.error(e);
      setErr("Erreur lors de l’ouverture du PDF.");
    }
  };

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
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-slate-500">Médecin du travail</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Fiches d’aptitude
            </h1>
            <p className="text-slate-500 mt-2">
              Consulter l’ensemble des fiches d’aptitude enregistrées.
            </p>
          </div>

          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {err}
        </div>
      ) : null}

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-3 max-w-md">
        <Search size={18} className="text-slate-500" />
        <input
          type="text"
          placeholder="Rechercher par nom, matricule, aptitude..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="outline-none w-full"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-slate-500">
          Aucune fiche d’aptitude trouvée.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((fiche) => (
            <div
              key={fiche.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 flex-1">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Collaborateur
                    </p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {`${fiche.collaborateur_nom || ""} ${fiche.collaborateur_prenom || ""}`.trim() || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Matricule
                    </p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {fiche.matricule || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Type examen
                    </p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {examenLabel(fiche.type_examen)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Aptitude
                    </p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {aptitudeLabel(fiche.aptitude)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Date
                    </p>
                    <p className="text-sm font-medium text-slate-900 mt-1">
                      {formatDate(fiche.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/medecin-travail/collaborateurs/${fiche.collaborateur}`)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Ouvrir dossier
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPdf(fiche.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    <FileText size={16} />
                    Ouvrir PDF
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
    </div>
  );
}