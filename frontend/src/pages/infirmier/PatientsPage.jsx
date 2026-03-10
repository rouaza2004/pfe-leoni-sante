import { useEffect, useState } from "react";
import { Search, User, ChevronRight } from "lucide-react";
import { api } from "@/api/api";
import { useNavigate } from "react-router-dom";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchCollaborateurs();
  }, []);

  const fetchCollaborateurs = async () => {
    try {
      setLoading(true);
      setErr("");

      console.log("TOKEN =", localStorage.getItem("access"));
      console.log("ROLE =", localStorage.getItem("role"));

      const res = await api.get("/collaborateurs/");

      console.log("API RESPONSE =", res.data);

      const data = Array.isArray(res.data) ? res.data : res.data.results || [];

      setCollaborateurs(data);
    } catch (e) {
      console.error("COLLAB ERROR =", e?.response?.status, e?.response?.data);
      setErr("Erreur chargement collaborateurs");
    } finally {
      setLoading(false);
    }
  };

  const filtered = collaborateurs.filter((c) =>
    `${c.nom} ${c.prenom} ${c.matricule}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h1 className="text-2xl font-bold text-slate-900">
          Accueil Patient
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Rechercher un collaborateur pour accéder à son dossier médical.
        </p>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3">
        <Search className="text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher nom, prénom ou matricule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm"
        />
      </div>

      {/* LIST */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">

        {loading && (
          <div className="p-6 text-center text-slate-500">
            Chargement...
          </div>
        )}

        {err && (
          <div className="p-6 text-center text-red-500">
            {err}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            Aucun collaborateur trouvé
          </div>
        )}

        {!loading &&
          filtered.map((c) => (
            <div
              key={c.id}
              onClick={() =>
                navigate(`/infirmier/patients/${c.id}`)
              }
              className="flex items-center justify-between px-6 py-4 border-b last:border-none hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-4">

                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <User size={18} />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {c.nom} {c.prenom}
                  </p>
                  <p className="text-xs text-slate-500">
                    Matricule: {c.matricule}
                  </p>
                </div>

              </div>

              <ChevronRight className="text-slate-400" size={18} />
            </div>
          ))}
      </div>
    </div>
  );
}