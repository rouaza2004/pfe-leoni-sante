import { Building2, MapPin, Plus, RadioTower, Search } from "lucide-react";
import { useMemo, useState } from "react";

const initialSites = [
  {
    id: 1,
    name: "LEONI Mateur",
    city: "Bizerte",
    status: "Actif",
    collaborators: 420,
  },
  {
    id: 2,
    name: "LEONI Sousse",
    city: "Sousse",
    status: "Actif",
    collaborators: 315,
  },
  {
    id: 3,
    name: "LEONI Monastir",
    city: "Monastir",
    status: "Maintenance",
    collaborators: 96,
  },
];

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            tone,
          ].join(" ")}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function AdminSites() {
  const [search, setSearch] = useState("");

  const filteredSites = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return initialSites;

    return initialSites.filter((site) =>
      [site.name, site.city, site.status].some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [search]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            Gestion des sites
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Visualisez les implantations LEONI et leur statut opérationnel.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
        >
          <Plus size={18} />
          Ajouter un site
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Sites suivis"
          value={initialSites.length}
          tone="bg-sky-100 text-sky-700"
        />
        <StatCard
          icon={RadioTower}
          label="Sites actifs"
          value={initialSites.filter((site) => site.status === "Actif").length}
          tone="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          icon={MapPin}
          label="Collaborateurs rattachés"
          value={initialSites.reduce((sum, site) => sum + site.collaborators, 0)}
          tone="bg-amber-100 text-amber-700"
        />
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste des sites</h2>
            <p className="mt-1 text-sm text-slate-500">
              Recherche rapide par nom, ville ou statut.
            </p>
          </div>

          <label className="flex h-12 min-w-[260px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un site..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Collaborateurs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900">{site.name}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{site.city}</td>
                  <td className="px-4 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1",
                        site.status === "Actif"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200",
                      ].join(" ")}
                    >
                      {site.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{site.collaborators}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
              Aucun site ne correspond à cette recherche.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

