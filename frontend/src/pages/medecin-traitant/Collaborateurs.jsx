import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/api";
import { Search, UserPlus, ChevronRight } from "lucide-react";

export default function Collaborateurs() {
  const [search, setSearch] = useState("");
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ action يجي من Dashboard: dossier / fiche / documents
  const action = searchParams.get("action") || "dossier";

  useEffect(() => {
    const fetchCollaborateurs = async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await api.get("/collaborateurs/");
        setCollaborateurs(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setErr("Erreur API (check token / URL)");
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborateurs();
  }, []);

  const filtered = collaborateurs.filter((c) =>
    `${c.nom} ${c.prenom} ${c.matricule}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ✅ FIX: حسب action نحدد وين نمشيو
  const goTo = (id) => {
    if (action === "fiche") {
      navigate(`/medecin-traitant/collaborateurs/${id}/fiche`);
      return;
    }
    if (action === "documents") {
      navigate(`/medecin-traitant/collaborateurs/${id}/documents`);
      return;
    }
    // default dossier/detail
    navigate(`/medecin-traitant/collaborateurs/${id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collaborateurs</h1>

          {/* ✅ صغير يبيّن action الحالي */}
          <p className="text-xs text-muted-foreground mt-1">
            Mode: <b>{action}</b>
          </p>
        </div>

        <button className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
          <UserPlus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, matricule..."
          className="w-full h-10 rounded-lg border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-xs font-medium px-4 py-3">Nom</th>
              <th className="text-left text-xs font-medium px-4 py-3">
                Matricule
              </th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => goTo(c.id)} // ✅ هنا FIX
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {c.prenom?.[0]}
                      {c.nom?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {c.prenom} {c.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 text-sm font-mono">{c.matricule}</td>

                <td className="px-4 py-3">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </td>
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-sm text-muted-foreground"
                  colSpan={3}
                >
                  Aucun collaborateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}