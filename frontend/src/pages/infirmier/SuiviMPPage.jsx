import { useMemo, useState } from "react";
import { Stethoscope } from "lucide-react";

const STORAGE_KEY = "mp_suivi_form_data";

const emptyForm = {
  numero: "",
  mois: "",
  dateDebutMaladie: "",
  matricule: "",
  nomPrenom: "",
  anciennete: "",
  dateNaissance: "",
  plant: "",
  gsm: "",
  age: "",
  maladieProfessionnelle: "",
  codeTableauCNAM: "",
  natureTravail: "",
  segment: "",
  psDepartement: "",
  dateEntree: "",
  cause: "",
  changementPoste: "NON",
  ancienPoste: "",
  nouveauPoste: "",
  decisionMedecin: "",
  reposInitial: "",
  prolongation: "",
  rechute: "",
  repriseMedecinTraitant: "",
  repriseMedecinTravail: "",
  dateDeclarationServiceMedical: "",
  dateSortieDeclaration: "",
};

function getInitialForm() {
  if (typeof window === "undefined") return emptyForm;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyForm;
    return { ...emptyForm, ...JSON.parse(stored) };
  } catch {
    return emptyForm;
  }
}

function toInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function calculateAge(value) {
  if (!value) return "";
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) years -= 1;
  return years >= 0 ? String(years) : "";
}

function calculateAnciennete(value) {
  if (!value) return "";
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "";
  const today = new Date();
  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  if (today.getDate() < start.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return "";
  const parts = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} mois`);
  return parts.join(" ") || "Moins d'un mois";
}

export default function SuiviMPPage() {
  const [form, setForm] = useState(getInitialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reposTotal = useMemo(
    () => toInt(form.reposInitial) + toInt(form.prolongation) + toInt(form.rechute),
    [form.reposInitial, form.prolongation, form.rechute]
  );

  const changementPosteOui = form.changementPoste === "OUI";

  function handleChange(event) {
    const { name, value } = event.target;
    setSuccess("");
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "dateNaissance") {
        next.age = calculateAge(value);
      }

      if (name === "dateEntree") {
        next.anciennete = calculateAnciennete(value);
      }

      if (name === "changementPoste" && value === "NON") {
        next.ancienPoste = "";
        next.nouveauPoste = "";
      }

      return next;
    });
  }

  function handleReset() {
    setForm(emptyForm);
    setError("");
    setSuccess("");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const requiredFields = [
      ["numero", "N°"],
      ["matricule", "Matricule"],
      ["nomPrenom", "Nom & prénom"],
      ["maladieProfessionnelle", "Maladie professionnelle"],
      ["codeTableauCNAM", "Code tableau CNAM"],
      ["decisionMedecin", "Décision du médecin"],
    ];

    const missing = requiredFields.find(([key]) => !String(form[key] || "").trim());
    if (missing) {
      setError(`Le champ "${missing[1]}" est obligatoire.`);
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...form, reposTotal })
        );
      }
      setSuccess("Suivi MP enregistré avec succès.");
    } catch {
      setError("Impossible d'enregistrer les données du suivi MP.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Stethoscope size={14} />
            Espace infirmier
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Suivi des maladies professionnelles
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Consultation et suivi des dossiers MP
            </p>
          </div>
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
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Formulaire de suivi MP</h2>
          <p className="mt-1 text-sm text-slate-500">
            Saisissez les informations de suivi en restant dans le format habituel du module.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="Informations générales">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <InputField label="N°" name="numero" value={form.numero} onChange={handleChange} required />
              <InputField label="Mois" name="mois" value={form.mois} onChange={handleChange} />
              <InputField label="Date de début de la maladie" name="dateDebutMaladie" type="date" value={form.dateDebutMaladie} onChange={handleChange} />
              <InputField label="Matricule" name="matricule" value={form.matricule} onChange={handleChange} required />
              <InputField label="Nom & prénom" name="nomPrenom" value={form.nomPrenom} onChange={handleChange} required />
              <InputField label="Ancienneté" name="anciennete" value={form.anciennete} onChange={handleChange} />
              <InputField label="Date de naissance" name="dateNaissance" type="date" value={form.dateNaissance} onChange={handleChange} />
              <InputField label="Plant" name="plant" value={form.plant} onChange={handleChange} />
              <InputField label="GSM" name="gsm" value={form.gsm} onChange={handleChange} />
              <ReadOnlyField label="Age" value={form.age} />
            </div>
          </Section>

          <Section title="Informations MP">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InputField label="Maladie professionnelle" name="maladieProfessionnelle" value={form.maladieProfessionnelle} onChange={handleChange} required />
              <InputField label="Code tableau CNAM" name="codeTableauCNAM" value={form.codeTableauCNAM} onChange={handleChange} required />
              <InputField label="Nature de travail" name="natureTravail" value={form.natureTravail} onChange={handleChange} />
              <InputField label="Segment" name="segment" value={form.segment} onChange={handleChange} />
              <InputField label="PS/Département" name="psDepartement" value={form.psDepartement} onChange={handleChange} />
              <InputField label="Date d’entrée" name="dateEntree" type="date" value={form.dateEntree} onChange={handleChange} />
              <InputField label="Cause" name="cause" value={form.cause} onChange={handleChange} />
            </div>
          </Section>

          <Section title="Poste">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SelectField
                label="Changement du poste"
                name="changementPoste"
                value={form.changementPoste}
                onChange={handleChange}
                options={[
                  { value: "NON", label: "Non" },
                  { value: "OUI", label: "Oui" },
                ]}
              />
              <InputField
                label="Ancien poste"
                name="ancienPoste"
                value={form.ancienPoste}
                onChange={handleChange}
                disabled={!changementPosteOui}
              />
              <InputField
                label="Nouveau poste"
                name="nouveauPoste"
                value={form.nouveauPoste}
                onChange={handleChange}
                disabled={!changementPosteOui}
              />
            </div>
          </Section>

          <Section title="Décision / arrêt / reprise">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InputField label="Décision du médecin" name="decisionMedecin" value={form.decisionMedecin} onChange={handleChange} required />
              <InputField label="Repos initial" name="reposInitial" type="number" value={form.reposInitial} onChange={handleChange} min="0" />
              <InputField label="Prolongation" name="prolongation" type="number" value={form.prolongation} onChange={handleChange} min="0" />
              <InputField label="Rechute" name="rechute" type="number" value={form.rechute} onChange={handleChange} min="0" />
              <ReadOnlyField label="Repos total" value={String(reposTotal)} />
              <InputField label="Reprise médecin traitant" name="repriseMedecinTraitant" type="date" value={form.repriseMedecinTraitant} onChange={handleChange} />
              <InputField label="Reprise médecin du travail" name="repriseMedecinTravail" type="date" value={form.repriseMedecinTravail} onChange={handleChange} />
              <InputField label="Date déclaration par service médical" name="dateDeclarationServiceMedical" type="date" value={form.dateDeclarationServiceMedical} onChange={handleChange} />
              <InputField label="Date sortie de la déclaration" name="dateSortieDeclaration" type="date" value={form.dateSortieDeclaration} onChange={handleChange} />
            </div>
          </Section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Réinitialiser
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

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  disabled,
  min,
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        min={min}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50"
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

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
        {value || "0"}
      </div>
    </div>
  );
}
