import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";

const initialSites = [
  {
    id: 1,
    name: "Site Mateur",
    location: "Mateur, Bizerte",
    responsible: "Amine Ben Salah",
    status: "Active",
  },
  {
    id: 2,
    name: "Site Sousse",
    location: "Sousse",
    responsible: "Nadia Trabelsi",
    status: "Active",
  },
  {
    id: 3,
    name: "Site Messadine",
    location: "Messadine, Sousse",
    responsible: "Karim Jaziri",
    status: "Inactive",
  },
  {
    id: 4,
    name: "Site Monastir",
    location: "Monastir",
    responsible: "Sarra Khelifi",
    status: "Active",
  },
];

const emptyForm = {
  name: "",
  location: "",
  responsible: "",
  status: "Active",
};

const StatCard = ({ title, value, subtitle, icon, alert = false, iconClass = "" }) => (
  <div
    className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
      alert ? "border-red-200" : "border-slate-200"
    }`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`mt-2 text-2xl font-bold ${alert ? "text-red-600" : "text-slate-900"}`}>
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          alert ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"
        } ${iconClass}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

function StatusBadge({ status }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 size={12} />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      <XCircle size={12} />
      Inactive
    </span>
  );
}

function SiteModal({ mode, site, form, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <section className="w-full max-w-xl rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Modifier le site" : "Ajouter un site"}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === "edit" ? site?.name : "Créer un nouveau site LEONI"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Site</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Localisation</span>
              <input
                type="text"
                value={form.location}
                onChange={(event) => onChange("location", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                required
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Responsable</span>
              <input
                type="text"
                value={form.responsible}
                onChange={(event) => onChange("responsible", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Statut</span>
              <select
                value={form.status}
                onChange={(event) => onChange("status", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {mode === "edit" ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DetailsModal({ site, onClose }) {
  if (!site) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <section className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{site.name}</h2>
              <p className="text-sm text-slate-500">Détails du site</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Site</span>
            <span className="font-semibold text-slate-900">{site.name}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Localisation</span>
            <span className="font-semibold text-slate-900">{site.location}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Responsable</span>
            <span className="font-semibold text-slate-900">{site.responsible}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Statut</span>
            <StatusBadge status={site.status} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdminSites() {
  const [sites, setSites] = useState(initialSites);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [detailsSite, setDetailsSite] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filteredSites = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return sites;

    return sites.filter((site) =>
      [site.name, site.location, site.responsible, site.status].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [searchTerm, sites]);

  const stats = useMemo(() => {
    const activeSites = sites.filter((site) => site.status === "Active").length;
    const inactiveSites = sites.filter((site) => site.status === "Inactive").length;
    const responsables = new Set(sites.map((site) => site.responsible)).size;

    return {
      total: sites.length,
      active: activeSites,
      inactive: inactiveSites,
      responsables,
    };
  }, [sites]);

  function openAddModal() {
    setSelectedSite(null);
    setForm(emptyForm);
    setModalMode("add");
  }

  function openEditModal(site) {
    setSelectedSite(site);
    setForm({
      name: site.name,
      location: site.location,
      responsible: site.responsible,
      status: site.status,
    });
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedSite(null);
    setForm(emptyForm);
  }

  function handleFormChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (modalMode === "edit" && selectedSite) {
      setSites((current) =>
        current.map((site) =>
          site.id === selectedSite.id
            ? {
                ...site,
                name: form.name,
                location: form.location,
                responsible: form.responsible,
                status: form.status,
              }
            : site,
        ),
      );
    } else {
      setSites((current) => [
        {
          id: Date.now(),
          name: form.name,
          location: form.location,
          responsible: form.responsible,
          status: form.status,
        },
        ...current,
      ]);
    }

    closeModal();
  }

  function handleDelete(siteId) {
    setSites((current) => current.filter((site) => site.id !== siteId));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-sm font-medium text-slate-500">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Gestion des Sites
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Suivi et gestion des sites LEONI, responsables et états d’activité.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sites"
          value={stats.total}
          subtitle="Sites enregistrés"
          icon={<Building2 size={22} className="text-blue-600" />}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Sites Actifs"
          value={stats.active}
          subtitle="Sites en activité"
          icon={<CheckCircle2 size={22} className="text-emerald-600" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Sites Inactifs"
          value={stats.inactive}
          subtitle="Sites à surveiller"
          icon={<XCircle size={22} className="text-amber-600" />}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Responsables"
          value={stats.responsables}
          subtitle="Responsables uniques"
          icon={<Users size={22} className="text-slate-700" />}
        />
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste des sites</h2>
            <p className="text-sm text-slate-500">
              Gestion des sites, emplacements et responsables.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher un site"
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Plus size={16} />
              Add Site
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-2 font-medium">Site</th>
                <th className="px-3 py-2 font-medium">Localisation</th>
                <th className="px-3 py-2 font-medium">Responsable</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => (
                <tr key={site.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Building2 size={16} />
                      </span>
                      {site.name}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      {site.location}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{site.responsible}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={site.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailsSite(site)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Voir les détails de ${site.name}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(site)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Modifier ${site.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(site.id)}
                        className="rounded-xl p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Supprimer ${site.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                    Aucun site disponible.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode ? (
        <SiteModal
          mode={modalMode}
          site={selectedSite}
          form={form}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}

      <DetailsModal site={detailsSite} onClose={() => setDetailsSite(null)} />
    </div>
  );
}
