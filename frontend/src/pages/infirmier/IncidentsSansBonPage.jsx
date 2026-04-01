import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { api } from "@/api/api";

const PAGE_SIZE = 10;

const emptyForm = {
  heure: "",
  matricule: "",
  segment: "",
  plant: "",
  nom_prenom: "",
  poste: "",
  mode_lesion: "",
  agent_causal: "",
  telephone: "",
  infirmier: "",
  remarque: "",
};

const StatCard = ({ title, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

const ModalShell = ({ open, title, onClose, children, footer }) => {
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
        {footer && <div className="border-t border-slate-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export default function IncidentsSansBonPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/medical/incidents-sans-bon/");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setErr("Erreur chargement incidents sans bon.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.nom_prenom, item.matricule, item.infirmier]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
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
      const d = item.created_at ? new Date(item.created_at) : null;
      return d && d.getMonth() === month && d.getFullYear() === year;
    }).length;
    const total = items.length;

    const countBy = (key) =>
      items.reduce((acc, item) => {
        const val = (item[key] || "").trim();
        if (!val) return acc;
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {});

    const infirmierCounts = countBy("infirmier");
    const agentCounts = countBy("agent_causal");

    const top = (obj) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || "--";

    return {
      thisMonth,
      total,
      topInfirmier: top(infirmierCounts),
      topAgent: top(agentCounts),
    };
  }, [items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErr("");
      if (editing) {
        await api.patch(`/medical/incidents-sans-bon/${editing}/`, form);
      } else {
        await api.post("/medical/incidents-sans-bon/", form);
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr("Erreur enregistrement incident.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setForm({
      heure: item.heure || "",
      matricule: item.matricule || "",
      segment: item.segment || "",
      plant: item.plant || "",
      nom_prenom: item.nom_prenom || "",
      poste: item.poste || "",
      mode_lesion: item.mode_lesion || "",
      agent_causal: item.agent_causal || "",
      telephone: item.telephone || "",
      infirmier: item.infirmier || "",
      remarque: item.remarque || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    const ok = window.confirm("Supprimer cet incident ?");
    if (!ok) return;
    try {
      setErr("");
      await api.delete(`/medical/incidents-sans-bon/${item.id}/`);
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr("Erreur suppression incident.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Incidents sans Bon</h1>
            <p className="text-sm text-slate-500">Suivi des incidents sans bon</p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total incidents (mois)" value={stats.thisMonth} />
        <StatCard title="Total incidents (global)" value={stats.total} />
        <StatCard title="Infirmier fréquent" value={stats.topInfirmier} />
        <StatCard title="Agent causal fréquent" value={stats.topAgent} />
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule, infirmier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Liste des incidents</h2>
          <p className="text-sm text-slate-500">Incidents sans bon</p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Chargement...</div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Heure</th>
                    <th className="px-3 py-3 font-medium">Matricule</th>
                    <th className="px-3 py-3 font-medium">Segment</th>
                    <th className="px-3 py-3 font-medium">Plant</th>
                    <th className="px-3 py-3 font-medium">Nom & Prénom</th>
                    <th className="px-3 py-3 font-medium">Poste</th>
                    <th className="px-3 py-3 font-medium">Mode Lésion</th>
                    <th className="px-3 py-3 font-medium">Agent Causal</th>
                    <th className="px-3 py-3 font-medium">Téléphone</th>
                    <th className="px-3 py-3 font-medium">Infirmier</th>
                    <th className="px-3 py-3 font-medium">Remarque</th>
                    <th className="px-3 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length > 0 ? (
                    pageItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-4">{item.heure || "--"}</td>
                        <td className="px-3 py-4">{item.matricule || "--"}</td>
                        <td className="px-3 py-4">{item.segment || "--"}</td>
                        <td className="px-3 py-4">{item.plant || "--"}</td>
                        <td className="px-3 py-4">{item.nom_prenom || "--"}</td>
                        <td className="px-3 py-4">{item.poste || "--"}</td>
                        <td className="px-3 py-4">{item.mode_lesion || "--"}</td>
                        <td className="px-3 py-4">{item.agent_causal || "--"}</td>
                        <td className="px-3 py-4">{item.telephone || "--"}</td>
                        <td className="px-3 py-4">{item.infirmier || "--"}</td>
                        <td className="px-3 py-4">{item.remarque || "--"}</td>
                        <td className="px-3 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} className="px-3 py-10 text-center text-slate-500">
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
                  ‹
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
                  ›
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
              form="incident-sans-bon-form"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        }
      >
        <form
          id="incident-sans-bon-form"
          onSubmit={handleSubmit}
          className="grid gap-4 lg:grid-cols-2"
        >
          {[
            ["heure", "Heure", "time"],
            ["matricule", "Matricule"],
            ["segment", "Segment"],
            ["plant", "Plant"],
            ["nom_prenom", "Nom & Prénom"],
            ["poste", "Poste"],
            ["mode_lesion", "Mode Lésion"],
            ["agent_causal", "Agent Causal"],
            ["telephone", "Téléphone"],
            ["infirmier", "Infirmier"],
          ].map(([name, label, type = "text"]) => (
            <div key={name}>
              <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>
          ))}
          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Remarque</label>
            <textarea
              name="remarque"
              value={form.remarque}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
        </form>
      </ModalShell>
    </div>
  );
}

