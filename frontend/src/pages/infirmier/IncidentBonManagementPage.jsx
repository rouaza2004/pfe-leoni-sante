import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/api/api";

const PAGE_SIZE = 10;

const baseEmptyForm = {
  date_bon: "",
  matricule: "",
  nom_prenom: "",
  telephone: "",
  numero_assurance: "",
  date_incident: "",
  destination: "",
  infirmier: "",
  cause: "",
  lesion: "",
};

const labels = {
  date_bon: "Date du bon",
  matricule: "Matricule",
  nom_prenom: "Nom et prénom",
  telephone: "Téléphone",
  numero_assurance: "Numéro d'assurance",
  date_incident: "Date de l'incident",
  destination: "Destination",
  infirmier: "Infirmier",
  cause: "Cause",
  lesion: "Lésion",
};

const fieldTypes = {
  date_bon: "date",
  date_incident: "date",
};

const requiredBaseFields = [
  "matricule",
  "nom_prenom",
  "date_incident",
  "destination",
  "infirmier",
  "cause",
  "lesion",
];

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 truncate text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ModalShell({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
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
  const fields = useMemo(
    () => (includeBonFields ? Object.keys(baseEmptyForm) : Object.keys(baseEmptyForm).filter((field) => field !== "date_bon")),
    [includeBonFields],
  );
  const emptyForm = useMemo(
    () =>
      fields.reduce((acc, field) => {
        acc[field] = "";
        return acc;
      }, {}),
    [fields],
  );
  const requiredFields = useMemo(
    () => (includeBonFields ? ["date_bon", ...requiredBaseFields] : requiredBaseFields),
    [includeBonFields],
  );

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setForm(emptyForm);
  }, [emptyForm]);

  useEffect(() => {
    loadItems();
  }, [endpoint]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(endpoint);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError(`Erreur lors du chargement des ${listLabel.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [
        item.nom_prenom,
        item.matricule,
        item.telephone,
        item.numero_assurance,
        item.destination,
        item.infirmier,
        item.cause,
        item.lesion,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const thisMonth = items.filter((item) => {
      const dateValue = item.date_incident || item.created_at;
      const d = dateValue ? new Date(dateValue) : null;
      return d && d.getMonth() === month && d.getFullYear() === year;
    }).length;

    const countBy = (key) =>
      items.reduce((acc, item) => {
        const val = (item[key] || "").trim();
        if (!val) return acc;
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

    const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || "--";

    return {
      thisMonth,
      total: items.length,
      topInfirmier: top(countBy("infirmier")),
      topCause: top(countBy("cause")),
    };
  }, [items]);

  const openCreateForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    requiredFields.forEach((field) => {
      if (!String(form[field] || "").trim()) {
        nextErrors[field] = `${labels[field]} est obligatoire.`;
      }
    });
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!validateForm()) {
      setError("Veuillez remplir les champs obligatoires avant d'enregistrer.");
      return;
    }

    try {
      setSaving(true);
      if (editing) {
        await api.patch(`${endpoint}${editing}/`, form);
        setSuccess("Incident modifié avec succès.");
      } else {
        const res = await api.post(endpoint, form);
        setItems((prev) => [res.data, ...prev]);
        setSuccess("Incident ajouté avec succès.");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      if (editing) {
        await loadItems();
      }
    } catch (e) {
      console.error(e);
      setError("Erreur lors de l'enregistrement de l'incident.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setForm(
      fields.reduce((acc, field) => {
        acc[field] = item[field] || "";
        return acc;
      }, {}),
    );
    setFieldErrors({});
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    const ok = window.confirm("Supprimer cet incident ?");
    if (!ok) return;

    try {
      setError("");
      setSuccess("");
      await api.delete(`${endpoint}${item.id}/`);
      setItems((prev) => prev.filter((current) => current.id !== item.id));
      setSuccess("Incident supprimé avec succès.");
    } catch (e) {
      console.error(e);
      setError("Erreur lors de la suppression de l'incident.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Module Infirmier</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} />
          {success}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total incidents (mois)" value={stats.thisMonth} />
        <StatCard title="Total incidents (global)" value={stats.total} />
        <StatCard title="Infirmier fréquent" value={stats.topInfirmier} />
        <StatCard title="Cause fréquente" value={stats.topCause} />
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule, assurance, destination, infirmier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Liste des incidents</h2>
          <p className="text-sm text-slate-500">{listLabel}</p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Chargement...</div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    {fields.map((field) => (
                      <th key={field} className="px-3 py-3 font-medium">
                        {labels[field]}
                      </th>
                    ))}
                    <th className="px-3 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length > 0 ? (
                    pageItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        {fields.map((field) => (
                          <td key={field} className="px-3 py-4 text-slate-700">
                            {item[field] || "--"}
                          </td>
                        ))}
                        <td className="px-3 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                              title="Modifier"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                              title="Supprimer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={fields.length + 1} className="px-3 py-10 text-center text-slate-500">
                        Aucun incident trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Page {safePage} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Préc.
                </button>
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[36px] rounded-lg border px-3 py-1.5 text-sm ${
                      page === safePage
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Suiv.
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalShell
        open={showForm}
        title={editing ? "Modifier incident" : "Nouvel incident"}
        onClose={() => setShowForm(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              form={formId}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          {fields.map((field) => (
            <div key={field}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {labels[field]}
                {requiredFields.includes(field) ? <span className="text-red-500"> *</span> : null}
              </label>
              <input
                type={fieldTypes[field] || "text"}
                name={field}
                value={form[field] || ""}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-3 outline-none focus:border-slate-900 ${
                  fieldErrors[field] ? "border-red-300 bg-red-50" : "border-slate-300"
                }`}
              />
              {fieldErrors[field] ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors[field]}</p>
              ) : null}
            </div>
          ))}
        </form>
      </ModalShell>
    </div>
  );
}
