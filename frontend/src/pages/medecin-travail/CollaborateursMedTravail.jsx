import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/api";
import { Search, User, FilePlus2, FolderOpen } from "lucide-react";

const getDossierStatus = (collab, dossier) => {
  const hasCollabInfo =
    !!collab?.cin &&
    !!collab?.date_naissance &&
    !!collab?.telephone &&
    !!collab?.poste &&
    !!collab?.departement;

  const hasDossierInfo =
    !!dossier?.entreprise &&
    !!dossier?.localite;

  return hasCollabInfo && hasDossierInfo;
};

export default function CollaborateursMedTravail() {
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollaborateurs();
  }, []);

  const fetchCollaborateurs = async () => {
    try {
      setLoading(true);

      const res = await api.get("/collaborateurs/");
      const collabs = Array.isArray(res.data) ? res.data : [];

      const enriched = await Promise.all(
        collabs.map(async (c) => {
          try {
            const dossierRes = await api.get(`/medical/dossier/${c.id}/`);
            const dossier = dossierRes.data || null;
            const dossierComplet = getDossierStatus(c, dossier);

            return {
              ...c,
              dossier_medical_data: dossier,
              dossier_complet: dossierComplet,
            };
          } catch (error) {
            console.error(`Erreur dossier collaborateur ${c.id}`, error);
            return {
              ...c,
              dossier_medical_data: null,
              dossier_complet: false,
            };
          }
        })
      );

      setCollaborateurs(enriched);
    } catch (err) {
      console.error(err);
      setCollaborateurs([]);
    } finally {
      setLoading(false);
    }
  };



  const filtered = collaborateurs.filter((c) =>
    `${c.nom || ""} ${c.prenom || ""} ${c.matricule || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-6 text-gray-500">Chargement collaborateurs...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Collaborateurs suivis médicalement
        </h1>
        <p className="text-sm text-slate-500">
          Créer, compléter et consulter les dossiers médicaux des collaborateurs.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-full max-w-md">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher collaborateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-3" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const isComplete = !!c.dossier_complet;

          return (
            <div
              key={c.id}
              className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/medecin-travail/collaborateurs/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                      <User size={20} />
                    </div>

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {c.nom} {c.prenom}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Matricule : {c.matricule}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      isComplete
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {isComplete ? "Dossier complet" : "Dossier incomplet"}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">
                    Poste : {c.poste || "Non défini"}
                  </p>

                  <p className="text-sm text-gray-500">
                    Département : {c.departement || "-"}
                  </p>

                  <p className="text-sm text-gray-500">
                    Site : {c.site?.nom || "-"} {c.site?.localite ? `- ${c.site.localite}` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/medecin-travail/collaborateurs/${c.id}`)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center justify-center gap-2"
                >
                  <FolderOpen size={16} />
                  Ouvrir
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/medecin-travail/collaborateurs/${c.id}/dossier`)
                  }
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
                    isComplete
                      ? "bg-slate-900 text-white hover:opacity-90"
                      : "bg-amber-500 text-white hover:opacity-90"
                  }`}
                >
                  <FilePlus2 size={16} />
                  {isComplete ? "Modifier dossier" : "Créer dossier"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 mt-4">Aucun collaborateur trouvé.</p>
      )}
    </div>
  );
}
