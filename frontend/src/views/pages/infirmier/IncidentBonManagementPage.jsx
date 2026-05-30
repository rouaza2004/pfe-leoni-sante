import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, TriangleAlert } from "lucide-react";
import { api } from "@/controllers/api/api";

const createInitialForm = (includeBonFields) => ({
  date_bon: "",
  date_incident: "",
  heure: "",
  matricule: "",
  nom_prenom: "",
  telephone: "",
  numero_assurance: "",
  destination: "",
  infirmier: "",
  cause: "",
  lesion: "",
  segment: "",
  plant: "",
  poste: "",
  mode_lesion: "",
  agent_causal: "",
  remarque: "",
  ...(includeBonFields ? {} : {}),
});

function Field({ label, name, value, onChange, type = "text", required = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
      />
    </label>
  );
}

export default function IncidentBonManagementPage({
  title,
  description,
  listLabel,
  endpoint,
  formId,
  includeBonFields,
}) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => createInitialForm(includeBonFields));

  useEffect(() => {
    loadItems();
  }, [endpoint]);

  async function loadItems() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(endpoint);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des incidents.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(createInitialForm(includeBonFields));
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      await api.post(endpoint, form);
      resetForm();
      await loadItems();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [
        item.matricule,
        item.nom_prenom,
        item.destination,
        item.cause,
        item.lesion,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [items, search]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Module Infirmier</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            {showForm ? "Fermer le formulaire" : "Ajouter"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Nouvel enregistrement</h2>
            <p className="text-sm text-slate-500">
              Complétez les informations puis validez pour enregistrer l'incident.
            </p>
          </div>

          <form id={formId} onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {includeBonFields ? (
              <Field
                label="Date du bon"
                name="date_bon"
                type="date"
                value={form.date_bon}
                onChange={handleChange}
                required
              />
            ) : null}

            <Field
              label="Date de l'incident"
              name="date_incident"
              type="date"
              value={form.date_incident}
              onChange={handleChange}
              required
            />

            {!includeBonFields ? (
              <Field
                label="Heure"
                name="heure"
                type="time"
                value={form.heure}
                onChange={handleChange}
              />
            ) : null}

            <Field label="Matricule" name="matricule" value={form.matricule} onChange={handleChange} />
            <Field label="Nom et prénom" name="nom_prenom" value={form.nom_prenom} onChange={handleChange} />
            <Field label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} />
            <Field
              label="Numéro assurance"
              name="numero_assurance"
              value={form.numero_assurance}
              onChange={handleChange}
            />
            <Field label="Destination" name="destination" value={form.destination} onChange={handleChange} />
            <Field label="Infirmier" name="infirmier" value={form.infirmier} onChange={handleChange} />
            <Field label="Cause" name="cause" value={form.cause} onChange={handleChange} />
            <Field label="Lésion" name="lesion" value={form.lesion} onChange={handleChange} />

            {!includeBonFields ? (
              <>
                <Field label="Segment" name="segment" value={form.segment} onChange={handleChange} />
                <Field label="Plant" name="plant" value={form.plant} onChange={handleChange} />
                <Field label="Poste" name="poste" value={form.poste} onChange={handleChange} />
                <Field
                  label="Mode lésion"
                  name="mode_lesion"
                  value={form.mode_lesion}
                  onChange={handleChange}
                />
                <Field
                  label="Agent causal"
                  name="agent_causal"
                  value={form.agent_causal}
                  onChange={handleChange}
                />
                <label className="block md:col-span-2 xl:col-span-3">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Remarque</span>
                  <textarea
                    name="remarque"
                    value={form.remarque}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                  />
                </label>
              </>
            ) : null}

            <div className="md:col-span-2 xl:col-span-3 flex items-center justify-end gap-3 pt-2">
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
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{listLabel}</h2>
            <p className="text-sm text-slate-500">Historique des enregistrements disponibles.</p>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher..."
              className="w-60 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Chargement...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-16 text-slate-500">
            <TriangleAlert size={18} />
            Aucun enregistrement trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Cause</th>
                  <th className="px-4 py-3">Lésion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {item.date_incident || item.date_bon || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {item.matricule || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{item.nom_prenom || "-"}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{item.destination || "-"}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{item.cause || "-"}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{item.lesion || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

