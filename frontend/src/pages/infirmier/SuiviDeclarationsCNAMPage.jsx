import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import * as XLSX from "xlsx";

const STORAGE_KEY = "cnam_suivi_declarations";

const emptyForm = {
  numero: "",
  nomPrenom: "",
  matriculeCnss: "",
  matricule: "",
  typeAccident: "travail",
  dateAccident: "",
  chauffeur: "",
  dateCollecteChauffeur: "",
  dateCachetCnam: "",
  dateDernierJourDeclaration: "",
  causeRetard: "",
  commentaire: "",
  correction: "",
};

function getStoredRows() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredRows(rows) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateRetard(dateCachetCnam, dateDernierJourDeclaration) {
  const cachet = parseDate(dateCachetCnam);
  const dernierJour = parseDate(dateDernierJourDeclaration);
  if (!cachet || !dernierJour) return "";
  const diffMs = cachet.getTime() - dernierJour.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatDateForExcel(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export default function SuiviDeclarationsCNAMPage() {
  const [form, setForm] = useState(emptyForm);
  const [savedRows, setSavedRows] = useState(getStoredRows);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const retard = useMemo(
    () => calculateRetard(form.dateCachetCnam, form.dateDernierJourDeclaration),
    [form.dateCachetCnam, form.dateDernierJourDeclaration]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setSuccess("");
    setError("");
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleReset() {
    setForm(emptyForm);
    setSuccess("");
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const requiredFields = [
      ["numero", "N°"],
      ["nomPrenom", "Nom et prénom"],
      ["matriculeCnss", "Matricule CNSS"],
      ["matricule", "Matricule"],
      ["dateAccident", "Date de l'accident"],
    ];

    const missing = requiredFields.find(([key]) => !String(form[key] || "").trim());
    if (missing) {
      setError(`Le champ "${missing[1]}" est obligatoire.`);
      return;
    }

    const nextRow = {
      ...form,
      retard,
    };
    const nextRows = [...savedRows, nextRow];
    setSavedRows(nextRows);
    saveStoredRows(nextRows);
    setSuccess("Déclaration CNAM enregistrée avec succès.");
    setForm(emptyForm);
  }

  function handleExportExcel() {
    const rowsToExport = savedRows.length ? savedRows : [{ ...form, retard }];
    if (!rowsToExport.length || (!savedRows.length && !form.numero && !form.nomPrenom)) {
      setError("Aucune donnée à exporter.");
      setSuccess("");
      return;
    }

    const excelRows = rowsToExport.map((row) => ({
      "N°": row.numero || "",
      "Nom et Prénom": row.nomPrenom || "",
      "Matricule CNSS": row.matriculeCnss || "",
      Matricule: row.matricule || "",
      "Type de l'accident": row.typeAccident || "",
      "Date de l'accident": formatDateForExcel(row.dateAccident),
      Chauffeur: row.chauffeur || "",
      "Date collecte chauffeur": formatDateForExcel(row.dateCollecteChauffeur),
      "Date cachet CNAM": formatDateForExcel(row.dateCachetCnam),
      "Date dernier jour déclaration": formatDateForExcel(row.dateDernierJourDeclaration),
      "Nombre du jour de retard": row.retard ?? "",
      "Cause du retard": row.causeRetard || "",
      Commentaire: row.commentaire || "",
      Actions: "",
      Correction: row.correction || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 26 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 24 },
      { wch: 18 },
      { wch: 20 },
      { wch: 28 },
      { wch: 14 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Suivi CNAM");
    XLSX.writeFile(workbook, "suivi-declarations-cnam.xlsx");
    setSuccess("Export Excel généré avec succès.");
    setError("");
  }

  const retardColorClass =
    retard === ""
      ? "text-slate-700"
      : Number(retard) > 0
      ? "text-red-600"
      : "text-emerald-600";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Suivi des déclarations CNAM
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Saisie et suivi des déclarations CNAM
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Formulaire CNAM
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Renseignez les informations de déclaration puis exportez-les en Excel.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Informations principales">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InputField label="N°" name="numero" value={form.numero} onChange={handleChange} required />
              <InputField label="Nom et prénom" name="nomPrenom" value={form.nomPrenom} onChange={handleChange} required />
              <InputField label="Matricule CNSS" name="matriculeCnss" value={form.matriculeCnss} onChange={handleChange} required />
              <InputField label="Matricule" name="matricule" value={form.matricule} onChange={handleChange} required />
              <SelectField
                label="Type de l'accident"
                name="typeAccident"
                value={form.typeAccident}
                onChange={handleChange}
                options={[
                  { value: "travail", label: "Travail" },
                  { value: "trajet", label: "Trajet" },
                ]}
              />
              <InputField label="Date de l'accident" name="dateAccident" type="date" value={form.dateAccident} onChange={handleChange} required />
            </div>
          </Section>

          <Section title="Informations chauffeur">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InputField label="Chauffeur" name="chauffeur" value={form.chauffeur} onChange={handleChange} />
            </div>
          </Section>

          <Section title="Suivi CNAM">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <InputField label="Date de collecte chauffeur" name="dateCollecteChauffeur" type="date" value={form.dateCollecteChauffeur} onChange={handleChange} />
              <InputField label="Date cachet CNAM" name="dateCachetCnam" type="date" value={form.dateCachetCnam} onChange={handleChange} />
              <InputField label="Date du dernier jour de déclaration" name="dateDernierJourDeclaration" type="date" value={form.dateDernierJourDeclaration} onChange={handleChange} />
            </div>
          </Section>

          <Section title="Retard">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ReadOnlyField
                label="Nombre du jour de retard"
                value={retard === "" ? "-" : String(retard)}
                valueClassName={retardColorClass}
              />
              <InputField label="Cause du retard" name="causeRetard" value={form.causeRetard} onChange={handleChange} />
              <TextareaField label="Commentaire" name="commentaire" value={form.commentaire} onChange={handleChange} />
            </div>
          </Section>

          <Section title="Autres">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <TextareaField label="Correction" name="correction" value={form.correction} onChange={handleChange} />
            </div>
          </Section>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleExportExcel}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Exporter Excel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", required }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
      />
    </div>
  );
}

function ReadOnlyField({ label, value, valueClassName = "" }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}
