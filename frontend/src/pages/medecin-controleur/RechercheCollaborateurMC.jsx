import { useState } from "react";
import { Search, FileCheck, FileSearch } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/api";

export default function RechercheCollaborateurMC() {
  const [matricule, setMatricule] = useState("");
  const [collaborateur, setCollaborateur] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!matricule.trim()) {
      setErr("Veuillez saisir une matricule.");
      return;
    }

    try {
      setLoading(true);
      setErr("");
      setCollaborateur(null);

      const res = await api.get(`/collaborateurs/?search=${matricule}`);
      const data = Array.isArray(res.data) ? res.data : [];

      const exactMatch = data.find(
        (item) => item.matricule?.toLowerCase() === matricule.trim().toLowerCase()
      );

      if (!exactMatch) {
        setErr("Aucun collaborateur trouvé avec cette matricule.");
        return;
      }

      setCollaborateur(exactMatch);
    } catch (e) {
      console.error(e);
      setErr("Erreur lors de la recherche du collaborateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Recherche Collaborateur
        </h1>
        <p className="text-slate-500">
          Recherche obligatoire par matricule
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Matricule
        </label>

        <div className="flex gap-3">
          <input
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            placeholder="Ex: EMP001"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            onClick={handleSearch}
            className="px-5 py-3 rounded-xl bg-slate-900 text-white flex items-center gap-2"
          >
            <Search size={18} />
            Rechercher
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Recherche en cours...</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
      </div>

      {collaborateur && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Informations du collaborateur
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Matricule :</span>{" "}
              <span className="font-medium">{collaborateur.matricule}</span>
            </div>
            <div>
              <span className="text-slate-500">Nom :</span>{" "}
              <span className="font-medium">{collaborateur.nom}</span>
            </div>
            <div>
              <span className="text-slate-500">Prénom :</span>{" "}
              <span className="font-medium">{collaborateur.prenom}</span>
            </div>
            <div>
              <span className="text-slate-500">Poste :</span>{" "}
              <span className="font-medium">{collaborateur.poste || "-"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() =>
                navigate(`/medecin-controleur/controle-medical/${collaborateur.id}`)
              }
              className="px-4 py-3 rounded-xl bg-emerald-600 text-white flex items-center gap-2"
            >
              <FileCheck size={18} />
              Créer Contrôle Médical
            </button>

            <button
              onClick={() =>
                navigate(`/medecin-controleur/demande-expertise/${collaborateur.id}`)
              }
              className="px-4 py-3 rounded-xl bg-amber-600 text-white flex items-center gap-2"
            >
              <FileSearch size={18} />
              Créer Demande Expertise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}