import { useMemo, useRef, useState } from "react";
import {
  Eye,
  FileSpreadsheet,
  FileUp,
  ShieldCheck,
  Upload,
  UserPlus,
} from "lucide-react";

const sampleRows = [
  {
    matricule: "NEW-2401",
    nom: "Ben Salem",
    prenom: "Sonia",
    departement: "Production",
    poste: "Operatrice cablage",
    dateImport: "2026-04-05",
    statut: "Valide",
    statutTone: "success",
  },
  {
    matricule: "NEW-2402",
    nom: "Trabelsi",
    prenom: "Karim",
    departement: "Qualite",
    poste: "Controleur qualite",
    dateImport: "2026-04-05",
    statut: "En attente",
    statutTone: "warning",
  },
  {
    matricule: "NEW-2403",
    nom: "Gharbi",
    prenom: "Meriem",
    departement: "Logistique",
    poste: "Magasiniere",
    dateImport: "2026-04-05",
    statut: "En attente",
    statutTone: "warning",
  },
];

const pillClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

function formatDateLabel(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusPill({ label, tone }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        pillClasses[tone] || pillClasses.warning
      }`}
    >
      {label}
    </span>
  );
}

export default function NouveauxOperateursRH() {
  const inputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const importedRows = useMemo(() => sampleRows, []);

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file?.name || "");
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                <UserPlus size={14} className="text-slate-700" />
                Parcours d'embauche
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 font-medium text-white">
                <ShieldCheck size={14} />
                RH onboarding
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                LEONI
              </p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
                Integration nouveaux operateurs
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600">
                Import Excel et affectation des visites d'embauche.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBrowseClick}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-200/60 transition hover:bg-sky-700"
          >
            <Upload size={16} />
            Importer fichier Excel
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="rounded-[28px] border-2 border-dashed border-sky-200 bg-sky-50/35 px-6 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-sky-200 bg-white text-sky-600 shadow-sm shadow-sky-100/60">
            <FileSpreadsheet size={28} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            Glissez-deposez votre fichier Excel ici
          </h2>
          <p className="mt-2 text-sm text-slate-500">Formats acceptes: .xlsx, .xls</p>

          <button
            type="button"
            onClick={handleBrowseClick}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/40 transition hover:bg-slate-50"
          >
            <FileUp size={16} />
            Parcourir
          </button>

          {selectedFileName ? (
            <p className="mt-4 text-sm font-medium text-slate-700">{selectedFileName}</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Derniere importation - {importedRows.length} operateurs
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Previsualisation, validation et affectation des visites d'embauche.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={15} />
              Previsualiser
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <ShieldCheck size={15} />
              Valider tout
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[980px] overflow-hidden rounded-[24px] border border-slate-200">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Prenom</th>
                  <th className="px-4 py-3">Departement</th>
                  <th className="px-4 py-3">Poste</th>
                  <th className="px-4 py-3">Date import</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {importedRows.map((row, index) => (
                  <tr
                    key={row.matricule}
                    className={`border-t border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/35"
                    }`}
                  >
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-900">{row.matricule}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">{row.nom}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-700">{row.prenom}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.departement}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{row.poste}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{formatDateLabel(row.dateImport)}</td>
                    <td className="px-4 py-3.5 text-sm">
                      <StatusPill label={row.statut} tone={row.statutTone} />
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      <button
                        type="button"
                        className="font-medium text-sky-700 transition hover:text-sky-800"
                      >
                        Affecter visite
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
