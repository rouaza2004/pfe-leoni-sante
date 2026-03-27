import { useEffect, useMemo, useState } from "react";
import { Plus, Search, TriangleAlert, Eye, Loader2 } from "lucide-react";
import { api } from "@/api/api";
import { getCollaborateurProfilByMatricule } from "../shared/collaborateurProfile.api";

const emptyForm = {
  matricule: "",
  date_incident: "",
  heure_incident: "",
  segment: "",
  unite: "",
  poste_occupe: "",
  mode_lesion: "",
  agent_causal: "",
  telephone: "",
  infirmier_responsable: "",
  remarque: "",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const selectedCollaborateur = selectedProfile?.collaborateur || null;

  const filteredIncidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return incidents;

    return incidents.filter((item) =>
      [item.matricule].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [incidents, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");

      const incidentsRes = await api.get("/medical/incidents/");
      const incidentsData = Array.isArray(incidentsRes.data) ? incidentsRes.data : [];

      const enriched = incidentsData.map((item) => ({
        ...item,
        collaborateur:
          `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() ||
          "—",
      }));

      setIncidents(enriched);
    } catch (e) {
      console.error(e);
      setErr("Erreur lors du chargement des incidents.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMatriculeSearch = async () => {
    if (!form.matricule.trim()) return;
    try {
      setErr("");
      const profile = await getCollaborateurProfilByMatricule(form.matricule.trim());
      setSelectedProfile(profile);
      const collab = profile?.collaborateur || {};

      setForm((prev) => ({
        ...prev,
        segment:
          prev.segment ||
          collab.segment_nom ||
          collab.segment?.nom ||
          collab.segment ||
          "",
        poste_occupe:
          prev.poste_occupe ||
          collab.poste_nom ||
          collab.poste?.nom ||
          collab.poste ||
          "",
        telephone: prev.telephone || collab.telephone || collab.tel || "",
      }));
    } catch (e) {
      console.error(e);
      setSelectedProfile(null);
      setErr("Matricule introuvable.");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.matricule.trim()) {
      alert("Veuillez saisir une matricule.");
      return;
    }

    try {
      setSaving(true);

      const dossierRes = await api.get(
        `/medical/dossier/matricule/${form.matricule.trim()}/`
      );
      const dossierId = dossierRes.data?.id;

      if (!dossierId) {
        alert("Dossier médical introuvable.");
        return;
      }

      await api.post("/medical/incidents/", {
        dossier: dossierId,
        date_incident: form.date_incident,
        heure_incident: form.heure_incident,
        segment: form.segment,
        unite: form.unite,
        poste_occupe: form.poste_occupe,
        mode_lesion: form.mode_lesion,
        agent_causal: form.agent_causal,
        telephone: form.telephone,
        infirmier_responsable: form.infirmier_responsable,
        remarque: form.remarque,
      });

      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement de l'incident.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Module Infirmier</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Gestion des incidents
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Enregistrer les soins infirmiers, consulter et suivre les incidents
              déclarés.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            {showForm ? "Fermer le formulaire" : "Ajouter incident"}
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
            <h2 className="text-lg font-semibold text-slate-900">Nouveau incident</h2>
            <p className="text-sm text-slate-500">
              Déclaration d&apos;un soin ou incident infirmier.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Matricule collaborateur
              </label>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  type="text"
                  name="matricule"
                  value={form.matricule}
                  onChange={handleChange}
                  required
                  placeholder="Entrer la matricule"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={handleMatriculeSearch}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Rechercher
                </button>
              </div>
              {selectedCollaborateur && (
                <p className="mt-2 text-sm text-slate-600">
                  {selectedCollaborateur.prenom} {selectedCollaborateur.nom}
                </p>
              )}
            </div>

            <ReadOnlyField
              label="Matricule"
              value={form.matricule || selectedCollaborateur?.matricule || ""}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Segment
              </label>
              <input
                type="text"
                name="segment"
                value={form.segment}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Unité
              </label>
              <input
                type="text"
                name="unite"
                value={form.unite}
                onChange={handleChange}
                placeholder="MH1 / MH2 / Neo / ..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Poste occupé
              </label>
              <input
                type="text"
                name="poste_occupe"
                value={form.poste_occupe}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                name="date_incident"
                value={form.date_incident}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Heure</label>
              <input
                type="time"
                name="heure_incident"
                value={form.heure_incident}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mode lésion
              </label>
              <input
                type="text"
                name="mode_lesion"
                value={form.mode_lesion}
                onChange={handleChange}
                required
                placeholder="Lésion superficielle / traumatisme / ..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Agent causal
              </label>
              <input
                type="text"
                name="agent_causal"
                value={form.agent_causal}
                onChange={handleChange}
                required
                placeholder="Contact / outil / faux mouvement / ..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Téléphone
              </label>
              <input
                type="text"
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Infirmier responsable
              </label>
              <input
                type="text"
                name="infirmier_responsable"
                value={form.infirmier_responsable}
                onChange={handleChange}
                required
                placeholder="Nom infirmier"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Remarque / soin effectué
              </label>
              <textarea
                name="remarque"
                value={form.remarque}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Glacage, bandage, soins locaux, physiogel, kétum gel..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste des incidents</h2>
            <p className="text-sm text-slate-500">
              Rechercher et consulter les incidents infirmiers enregistrés.
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
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Heure</th>
                  <th className="px-3 py-3 font-medium">Collaborateur</th>
                  <th className="px-3 py-3 font-medium">Matricule</th>
                  <th className="px-3 py-3 font-medium">Segment</th>
                  <th className="px-3 py-3 font-medium">Unité</th>
                  <th className="px-3 py-3 font-medium">Mode lésion</th>
                  <th className="px-3 py-3 font-medium">Infirmier</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 text-slate-700">{item.date_incident}</td>
                      <td className="px-3 py-3 text-slate-700">{item.heure_incident}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.collaborateur}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{item.matricule}</td>
                      <td className="px-3 py-3 text-slate-700">{item.segment}</td>
                      <td className="px-3 py-3 text-slate-700">{item.unite || "-"}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <TriangleAlert size={12} />
                          {item.mode_lesion}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {item.infirmier_responsable || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setSelectedIncident(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Eye size={14} />
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-3 py-10 text-center text-slate-500">
                      Aucun incident trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedIncident && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Détail incident</h2>
              <p className="text-sm text-slate-500">
                Consultation rapide des soins infirmiers enregistrés.
              </p>
            </div>

            <button
              onClick={() => setSelectedIncident(null)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Info label="Date" value={selectedIncident.date_incident} />
            <Info label="Heure" value={selectedIncident.heure_incident} />
            <Info label="Collaborateur" value={selectedIncident.collaborateur} />
            <Info label="Matricule" value={selectedIncident.matricule} />
            <Info label="Segment" value={selectedIncident.segment} />
            <Info label="Unité" value={selectedIncident.unite || "-"} />
            <Info label="Poste occupé" value={selectedIncident.poste_occupe} />
            <Info label="Mode lésion" value={selectedIncident.mode_lesion} />
            <Info label="Agent causal" value={selectedIncident.agent_causal} />
            <Info label="Téléphone" value={selectedIncident.telephone || "-"} />
            <Info
              label="Infirmier responsable"
              value={selectedIncident.infirmier_responsable || "-"}
            />

            <div className="md:col-span-2 xl:col-span-3">
              <p className="mb-1 text-sm font-medium text-slate-700">
                Remarque / soin effectué
              </p>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                {selectedIncident.remarque || "Aucune remarque"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 outline-none"
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}
