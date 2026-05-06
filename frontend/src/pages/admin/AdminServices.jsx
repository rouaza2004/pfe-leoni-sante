import { Pencil, Plus, Trash2 } from "lucide-react";

const services = [
  {
    name: "Consultation Générale",
    description: "Consultation médicale standard",
    category: "Consultation",
    price: "0 TND",
    active: true,
  },
  {
    name: "Radiographie",
    description: "Imagerie par rayons X",
    category: "Imagerie",
    price: "80 TND",
    active: true,
  },
  {
    name: "Analyse de Sang",
    description: "Bilan sanguin complet",
    category: "Laboratoire",
    price: "0 TND",
    active: true,
  },
  {
    name: "Échographie",
    description: "Examen par ultrasons",
    category: "Imagerie",
    price: "50 TND",
    active: true,
  },
  {
    name: "ECG",
    description: "Électrocardiogramme",
    category: "Cardiologie",
    price: "340 TND",
    active: false,
  },
];

export default function AdminServices() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
          Gestion des Services
        </h1>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          <Plus size={16} />
          Ajouter Service
        </button>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Nom
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Catégorie
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Prix (MAD)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Actif
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {services.map((service) => (
                <tr key={service.name} className="transition-colors hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{service.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      {service.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-800">
                    {service.price}
                  </td>
                  <td className="px-6 py-4">
                    {service.active ? (
                      <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                        Oui
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-300">
                        Non
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Modifier ${service.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Supprimer ${service.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
