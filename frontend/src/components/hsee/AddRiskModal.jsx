import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  RISK_CATEGORY_OPTIONS,
  RISK_DEPARTMENT_OPTIONS,
} from "@/services/hseeRiskMapService";

const INITIAL_VALUES = {
  title: "",
  category: "",
  department: "",
  description: "",
  probability: "",
  gravity: "",
  preventiveMeasuresText: "",
  responsible: "",
  dueDate: "",
};

function FormField({ label, required, error, children }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        {required ? <span className="text-rose-500">*</span> : null}
      </div>
      {children}
      {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}
    </label>
  );
}

function baseInputClass(hasError) {
  return `w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:bg-white ${
    hasError
      ? "border-rose-300 focus:border-rose-400"
      : "border-slate-200 focus:border-sky-300"
  }`;
}

function parseMeasures(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validate(values) {
  const errors = {};

  if (!values.title.trim()) errors.title = "Le titre du risque est obligatoire.";
  if (!values.category) errors.category = "La catégorie est obligatoire.";
  if (!values.department) errors.department = "Le département est obligatoire.";
  if (!values.description.trim()) errors.description = "La description est obligatoire.";

  const probability = Number(values.probability);
  if (!probability || probability < 1 || probability > 5) {
    errors.probability = "La probabilité doit être comprise entre 1 et 5.";
  }

  const gravity = Number(values.gravity);
  if (!gravity || gravity < 1 || gravity > 5) {
    errors.gravity = "La gravité doit être comprise entre 1 et 5.";
  }

  return errors;
}

export default function AddRiskModal({ open, onOpenChange, onSubmit, saving = false }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setValues(INITIAL_VALUES);
      setErrors({});
    }
  }, [open]);

  const criticalityPreview = useMemo(() => {
    const probability = Number(values.probability);
    const gravity = Number(values.gravity);
    if (!probability || !gravity) return 0;
    return probability * gravity;
  }, [values.gravity, values.probability]);

  const handleChange = (field) => (event) => {
    const nextValue = event.target.value;
    setValues((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      title: values.title,
      category: values.category,
      department: values.department,
      description: values.description,
      probability: Number(values.probability),
      gravity: Number(values.gravity),
      preventiveMeasures: parseMeasures(values.preventiveMeasuresText),
      responsible: values.responsible,
      dueDate: values.dueDate,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-2xl font-semibold tracking-tight text-slate-950">
                Ajouter un Nouveau Risque
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
                Renseignez les informations essentielles pour ajouter un risque à la cartographie.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Titre du risque" required error={errors.title}>
                <input
                  type="text"
                  value={values.title}
                  onChange={handleChange("title")}
                  placeholder="Ex: Chute de hauteur..."
                  className={baseInputClass(Boolean(errors.title))}
                />
              </FormField>

              <FormField label="Catégorie" required error={errors.category}>
                <select
                  value={values.category}
                  onChange={handleChange("category")}
                  className={baseInputClass(Boolean(errors.category))}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {RISK_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Département" required error={errors.department}>
                <select
                  value={values.department}
                  onChange={handleChange("department")}
                  className={baseInputClass(Boolean(errors.department))}
                >
                  <option value="">Sélectionner un département</option>
                  {RISK_DEPARTMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Responsable">
                <input
                  type="text"
                  value={values.responsible}
                  onChange={handleChange("responsible")}
                  placeholder="Nom du responsable"
                  className={baseInputClass(false)}
                />
              </FormField>
            </div>

            <FormField label="Description" required error={errors.description}>
              <textarea
                value={values.description}
                onChange={handleChange("description")}
                placeholder="Décrire le risque..."
                rows={4}
                className={`${baseInputClass(Boolean(errors.description))} resize-none`}
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-[1fr_1fr_1fr]">
              <FormField label="Probabilité (1-5)" required error={errors.probability}>
                <select
                  value={values.probability}
                  onChange={handleChange("probability")}
                  className={baseInputClass(Boolean(errors.probability))}
                >
                  <option value="">Choisir</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Gravité (1-5)" required error={errors.gravity}>
                <select
                  value={values.gravity}
                  onChange={handleChange("gravity")}
                  className={baseInputClass(Boolean(errors.gravity))}
                >
                  <option value="">Choisir</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-700">Criticité calculée</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {criticalityPreview}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Probabilité × Gravité
                </p>
              </div>
            </div>

            <FormField label="Mesures préventives">
              <textarea
                value={values.preventiveMeasuresText}
                onChange={handleChange("preventiveMeasuresText")}
                placeholder={"Une ligne par mesure\nPort du casque\nSignalisation\nFormation sécurité"}
                rows={4}
                className={`${baseInputClass(false)} resize-none`}
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Échéance">
                <input
                  type="date"
                  value={values.dueDate}
                  onChange={handleChange("dueDate")}
                  className={baseInputClass(false)}
                />
              </FormField>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Annuler
                </button>
              </Dialog.Close>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
