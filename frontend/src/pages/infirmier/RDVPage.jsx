import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { api } from "@/api/api";

const emptyForm = {
  collaborateur: "",
  medecin: "",
  type_medecin: "TRAITANT",
  date: "",
  heure: "",
  motif: "",
  statut: "PREVU",
};

const medecinTypeLabel = {
  TRAITANT: "Médecin traitant",
  TRAVAIL: "Médecin du travail",
  CONTROLEUR: "Médecin contrôleur",
};

const statutLabel = {
  PREVU: "Prévu",
  TERMINE: "Terminé",
  REPORTE: "Reporté",
  ANNULE: "Annulé",
};

export default function RDVPage() {
  const [rdvs, setRdvs] = useState([]);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [search, setSearch] = useState("");
  const [collabSearch, setCollabSearch] = useState("");
  const [matchedCollab, setMatchedCollab] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");

      const [rdvRes, collabRes] = await Promise.all([
        api.get("/appointments/rdv/"),
        api.get("/collaborateurs/"),
      ]);

      setRdvs(Array.isArray(rdvRes.data) ? rdvRes.data : []);
      setCollaborateurs(Array.isArray(collabRes.data) ? collabRes.data : []);
      const medRes = await api.get("/medecins/");
      setMedecins(Array.isArray(medRes.data) ? medRes.data : []);
    } catch (e) {
      console.error(e);
      setErr("Erreur chargement rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rdvs;

    return rdvs.filter((item) =>
      [item.matricule].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [rdvs, search]);

  const filteredCollaborateurs = useMemo(() => {
    const q = collabSearch.trim().toLowerCase();
    if (!q) return collaborateurs;
    return collaborateurs.filter((c) =>
      [c.matricule]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [collaborateurs, collabSearch]);

  const handleMatriculeChange = (e) => {
    const value = e.target.value;
    setCollabSearch(value);
    const q = value.trim().toLowerCase();
    if (!q) {
      setMatchedCollab(null);
      setForm((prev) => ({ ...prev, collaborateur: "" }));
      return;
    }
    const found = collaborateurs.find(
      (c) => (c.matricule || "").toLowerCase() === q
    );
    if (found) {
      setMatchedCollab(found);
      setForm((prev) => ({ ...prev, collaborateur: String(found.id) }));
    } else {
      setMatchedCollab(null);
      setForm((prev) => ({ ...prev, collaborateur: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setErr("");

      await api.post("/appointments/rdv/", {
        collaborateur: Number(form.collaborateur),
        medecin: form.medecin ? Number(form.medecin) : null,
        type_medecin: form.type_medecin,
        date: form.date,
        heure: form.heure,
        motif: form.motif,
        statut: form.statut,
      });

      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (e) {
      console.error(e);
      setErr("Erreur enregistrement rendez-vous.");
    } finally {
      setSaving(false);
    }
  };

  const badgeClass = (statut) => {
    switch (statut) {
      case "PREVU":
        return "bg-blue-100 text-blue-700";
      case "TERMINE":
        return "bg-emerald-100 text-emerald-700";
      case "REPORTE":
        return "bg-amber-100 text-amber-700";
      case "ANNULE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
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
              Préparer les rendez-vous pour les différents types de médecins.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
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
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Nouveau rendez-vous
          </h2>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Collaborateur
              </label>
              <input
                type="text"
                placeholder="Rechercher par matricule..."
                value={collabSearch}
                onChange={handleMatriculeChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
              />
              <div className="mt-2 text-sm text-slate-600">
                {matchedCollab
                  ? `${matchedCollab.nom} ${matchedCollab.prenom}`
                  : collabSearch
                  ? "Matricule introuvable."
                  : "Saisir un matricule."}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Type médecin
              </label>
              <select
                name="type_medecin"
                value={form.type_medecin}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="">Sélectionner</option>
                {medecins.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role})
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Statut</label>
              <select
                name="statut"
                value={form.statut}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="PREVU">Prévu</option>
                <option value="TERMINE">Terminé</option>
                <option value="REPORTE">Reporté</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">Motif</label>
              <textarea
                name="motif"
                value={form.motif}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setShowForm(false);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste des rendez-vous</h2>
            <p className="text-sm text-slate-500">
              Suivi et préparation des visites médicales
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher par matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Collaborateur</th>
                  <th className="px-3 py-3 font-medium">Matricule</th>
                  <th className="px-3 py-3 font-medium">Médecin</th>
                  <th className="px-3 py-3 font-medium">Type médecin</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Heure</th>
                  <th className="px-3 py-3 font-medium">Motif</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.collaborateur_nom} {item.collaborateur_prenom}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {item.matricule || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {item.medecin_nom || "-"}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {medecinTypeLabel[item.type_medecin] || item.type_medecin}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{item.date}</td>
                      <td className="px-3 py-3 text-slate-700">{item.heure}</td>
                      <td className="px-3 py-3 text-slate-700">{item.motif}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(
                            item.statut
                          )}`}
                        >
                          {statutLabel[item.statut] || item.statut}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-3 py-10 text-center text-slate-500">
                      Aucun rendez-vous trouvé.
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
