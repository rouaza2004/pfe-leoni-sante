import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { api } from "@/api/api";
import HSEEPageHeader from "@/components/hsee/HSEEPageHeader";

const STEPS = [
  { id: 1, label: "Infos Generales" },
  { id: 2, label: "Nature & Siege" },
  { id: 3, label: "Analyse Causes" },
  { id: 4, label: "Plan d'Action" },
];

const emptyAction = () => ({
  correctiveAction: "",
  responsable: "",
  dateLimite: "",
  statut: "En attente",
});

const initialData = {
  general: {
    victimeNom: "",
    victimeMatricule: "",
    departement: "",
    posteShift: "",
    dateIncident: "",
    heureIncident: "",
    lieuIncident: "",
    descriptionIncident: "",
  },
  lesion: {
    natureLesion: "",
    agentMateriel: "",
    causeIdentifiee: "",
    presenceStandard: "",
    respectStandard: "",
    actionImmediate: "",
    siegeLesion: "",
  },
  causes: {
    why1: "",
    why2: "",
    why3: "",
    why4: "",
    why5: "",
    methode: "",
    mainDoeuvre: "",
    materiel: "",
    milieu: "",
    matiere: "",
  },
  actions: [emptyAction()],
};

const bodyParts = [
  { id: "Tete", x: 80, y: 28, width: 36, height: 36, radius: 18 },
  { id: "Cou", x: 90, y: 66, width: 16, height: 14, radius: 8 },
  { id: "Epaule G", x: 48, y: 82, width: 30, height: 18, radius: 9 },
  { id: "Epaule D", x: 118, y: 82, width: 30, height: 18, radius: 9 },
  { id: "Bras G", x: 38, y: 102, width: 18, height: 60, radius: 9 },
  { id: "Bras D", x: 140, y: 102, width: 18, height: 60, radius: 9 },
  { id: "Main G", x: 34, y: 164, width: 22, height: 22, radius: 11 },
  { id: "Main D", x: 140, y: 164, width: 22, height: 22, radius: 11 },
  { id: "Thorax", x: 68, y: 86, width: 60, height: 42, radius: 16 },
  { id: "Abdomen", x: 76, y: 130, width: 44, height: 38, radius: 14 },
  { id: "Bassin", x: 72, y: 170, width: 52, height: 24, radius: 12 },
  { id: "Cuisse G", x: 76, y: 196, width: 20, height: 62, radius: 10 },
  { id: "Cuisse D", x: 100, y: 196, width: 20, height: 62, radius: 10 },
  { id: "Genou G", x: 76, y: 260, width: 20, height: 18, radius: 9 },
  { id: "Genou D", x: 100, y: 260, width: 20, height: 18, radius: 9 },
  { id: "Jambe G", x: 76, y: 280, width: 18, height: 62, radius: 9 },
  { id: "Jambe D", x: 102, y: 280, width: 18, height: 62, radius: 9 },
  { id: "Pied G", x: 66, y: 344, width: 28, height: 16, radius: 8 },
  { id: "Pied D", x: 102, y: 344, width: 28, height: 16, radius: 8 },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatTodayLabel() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function validateStep(step, data) {
  const errors = {};
  if (step === 1) {
    ["victimeNom", "victimeMatricule", "departement", "posteShift", "dateIncident", "heureIncident", "lieuIncident", "descriptionIncident"].forEach((field) => {
      if (!String(data.general[field] || "").trim()) errors[field] = "Champ obligatoire.";
    });
  }
  if (step === 2) {
    ["natureLesion", "agentMateriel", "causeIdentifiee", "presenceStandard", "respectStandard", "actionImmediate", "siegeLesion"].forEach((field) => {
      if (!String(data.lesion[field] || "").trim()) errors[field] = "Champ obligatoire.";
    });
  }
  if (step === 3) {
    ["why1", "why2", "why3", "why4", "why5", "methode", "mainDoeuvre", "materiel", "milieu", "matiere"].forEach((field) => {
      if (!String(data.causes[field] || "").trim()) errors[field] = "Champ obligatoire.";
    });
  }
  if (step === 4) {
    data.actions.forEach((action, index) => {
      if (!String(action.correctiveAction || "").trim()) {
        errors[`action_${index}_correctiveAction`] = "Champ obligatoire.";
      }
      if (!String(action.responsable || "").trim()) {
        errors[`action_${index}_responsable`] = "Champ obligatoire.";
      }
      if (!String(action.dateLimite || "").trim()) {
        errors[`action_${index}_dateLimite`] = "Champ obligatoire.";
      }
    });
  }
  return errors;
}

function buildPdf(data) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 18;
  const margin = 14;
  const line = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "-"), margin + 55, y);
    y += 6;
  };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Fiche d'Enquete AT / Incident", 105, y, { align: "center" });
  y += 10;
  line("Victime :", data.general.victimeNom);
  line("Matricule :", data.general.victimeMatricule);
  line("Departement :", data.general.departement);
  line("Date :", data.general.dateIncident);
  line("Heure :", data.general.heureIncident);
  line("Lieu :", data.general.lieuIncident);
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text("Description :", margin, y);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(data.general.descriptionIncident || "-", 180);
  doc.text(lines, margin, y + 5);
  return doc;
}

function Field({ label, required = false, error = "", children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function Input(props) {
  const { label, required, error, ...rest } = props;
  return (
    <Field label={label} required={required} error={error}>
      <input
        {...rest}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </Field>
  );
}

function Textarea(props) {
  const { label, required, error, rows = 4, ...rest } = props;
  return (
    <Field label={label} required={required} error={error}>
      <textarea
        {...rest}
        rows={rows}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </Field>
  );
}

function Stepper({ currentStep, completedSteps }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-4">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = completedSteps.includes(step.id);
          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={classNames(
                  "flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold",
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-slate-200 bg-slate-100 text-slate-500",
                )}
              >
                {isDone ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <p className={classNames("text-sm font-semibold", isDone ? "text-emerald-700" : isActive ? "text-blue-700" : "text-slate-500")}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BodyMap({ selectedPart, onSelect, error }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="mx-auto max-w-[220px]">
        <svg viewBox="0 0 200 380" className="h-[380px] w-full">
          {bodyParts.map((part) => {
            const active = selectedPart === part.id;
            return (
              <rect
                key={part.id}
                x={part.x}
                y={part.y}
                width={part.width}
                height={part.height}
                rx={part.radius}
                fill={active ? "#2563eb" : "#dbeafe"}
                stroke={active ? "#1d4ed8" : "#94a3b8"}
                strokeWidth="2"
                className="cursor-pointer"
                onClick={() => onSelect(part.id)}
              />
            );
          })}
        </svg>
        <p className="mt-3 text-center text-sm font-semibold text-slate-800">
          {selectedPart || "Aucun siege selectionne"}
        </p>
        <p className="mt-1 text-center text-xs text-slate-500">
          Cliquez sur une partie du corps pour la selectionner
        </p>
        {error ? <p className="mt-2 text-center text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

function ActionCard({ action, index, errors, onChange, onRemove, canRemove }) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
          Action {index + 1}
        </span>
        {canRemove ? (
          <button type="button" onClick={onRemove} className="text-sm text-red-600">
            Supprimer
          </button>
        ) : null}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Textarea
            label="Action corrective / preventive"
            required
            rows={4}
            value={action.correctiveAction}
            error={errors[`action_${index}_correctiveAction`]}
            onChange={(e) => onChange(index, "correctiveAction", e.target.value)}
          />
        </div>
        <Input
          label="Responsable"
          required
          value={action.responsable}
          error={errors[`action_${index}_responsable`]}
          onChange={(e) => onChange(index, "responsable", e.target.value)}
        />
        <Input
          label="Date limite"
          required
          type="date"
          value={action.dateLimite}
          error={errors[`action_${index}_dateLimite`]}
          onChange={(e) => onChange(index, "dateLimite", e.target.value)}
        />
        <Field label="Statut">
          <select
            value={action.statut}
            onChange={(e) => onChange(index, "statut", e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none"
          >
            <option>En attente</option>
            <option>En cours</option>
            <option>Cloture</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

export default function HSEEEnqueteWizardPage() {
  const [formData, setFormData] = useState(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [err, setErr] = useState("");

  const completedSteps = useMemo(
    () => STEPS.filter((step) => Object.keys(validateStep(step.id, formData)).length === 0).map((step) => step.id),
    [formData],
  );

  const updateSection = (section, field, value) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateAction = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) => (i === index ? { ...action, [field]: value } : action)),
    }));
  };

  const goNext = () => {
    const nextErrors = validateStep(currentStep, formData);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const goPrevious = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const allErrors = STEPS.reduce((acc, step) => ({ ...acc, ...validateStep(step.id, formData) }), {});
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      return;
    }
    try {
      setSaving(true);
      setErr("");
      setSuccess("");
      await api.post("/hsee/enquetes/", formData);
      const doc = buildPdf(formData);
      doc.save("fiche-enquete-at-incident.pdf");
      setSuccess("La fiche HSEE a ete enregistree et exportee en PDF.");
    } catch (error) {
      console.error(error);
      setErr(error?.response?.data?.detail || "Erreur lors de l'enregistrement de la fiche HSEE.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 pb-8">
      <HSEEPageHeader
        title="Fiche d'Enquête AT/Incident"
        subtitle={formatTodayLabel()}
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un dossier..."
                className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none sm:w-72"
              />
            </div>
            <button
              type="button"
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                3
              </span>
            </button>
          </>
        }
      />

      <Stepper currentStep={currentStep} completedSteps={completedSteps} />

      {err ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {currentStep === 1 ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Input label="Nom et Prenom de la victime" required value={formData.general.victimeNom} error={errors.victimeNom} onChange={(e) => updateSection("general", "victimeNom", e.target.value)} />
            <Input label="Matricule de la victime" required value={formData.general.victimeMatricule} error={errors.victimeMatricule} onChange={(e) => updateSection("general", "victimeMatricule", e.target.value)} />
            <Input label="Departement / Service" required value={formData.general.departement} error={errors.departement} onChange={(e) => updateSection("general", "departement", e.target.value)} />
            <Input label="Poste / Shift" required value={formData.general.posteShift} error={errors.posteShift} onChange={(e) => updateSection("general", "posteShift", e.target.value)} />
            <Input label="Date de l'incident" required type="date" value={formData.general.dateIncident} error={errors.dateIncident} onChange={(e) => updateSection("general", "dateIncident", e.target.value)} />
            <Input label="Heure de l'incident" required type="time" value={formData.general.heureIncident} error={errors.heureIncident} onChange={(e) => updateSection("general", "heureIncident", e.target.value)} />
            <Input label="Lieu de l'incident" required value={formData.general.lieuIncident} error={errors.lieuIncident} onChange={(e) => updateSection("general", "lieuIncident", e.target.value)} />
            <div className="hidden md:block" />
            <div className="md:col-span-2">
              <Textarea label="Description detaillee de l'AT / Incident" required rows={6} value={formData.general.descriptionIncident} error={errors.descriptionIncident} onChange={(e) => updateSection("general", "descriptionIncident", e.target.value)} />
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Input label="Nature de la lesion" required value={formData.lesion.natureLesion} error={errors.natureLesion} onChange={(e) => updateSection("lesion", "natureLesion", e.target.value)} />
                <Input label="Agent materiel" required value={formData.lesion.agentMateriel} error={errors.agentMateriel} onChange={(e) => updateSection("lesion", "agentMateriel", e.target.value)} />
                <Input label="Cause identifiee" required value={formData.lesion.causeIdentifiee} error={errors.causeIdentifiee} onChange={(e) => updateSection("lesion", "causeIdentifiee", e.target.value)} />
                <Input label="Siege selectionne" required value={formData.lesion.siegeLesion} error={errors.siegeLesion} readOnly />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Presence d'un standard" required error={errors.presenceStandard}>
                  <div className="flex gap-3">
                    {["Oui", "Non"].map((option) => (
                      <button key={option} type="button" onClick={() => updateSection("lesion", "presenceStandard", option)} className={classNames("rounded-2xl border px-4 py-3 text-sm", formData.lesion.presenceStandard === option ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                        {option}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Respect du standard" required error={errors.respectStandard}>
                  <div className="flex gap-3">
                    {["Oui", "Non"].map((option) => (
                      <button key={option} type="button" onClick={() => updateSection("lesion", "respectStandard", option)} className={classNames("rounded-2xl border px-4 py-3 text-sm", formData.lesion.respectStandard === option ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                        {option}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <Textarea label="Action immediate prise" required rows={5} value={formData.lesion.actionImmediate} error={errors.actionImmediate} onChange={(e) => updateSection("lesion", "actionImmediate", e.target.value)} />
            </div>
            <BodyMap selectedPart={formData.lesion.siegeLesion} onSelect={(part) => updateSection("lesion", "siegeLesion", part)} error={errors.siegeLesion} />
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6">
              <h3 className="mb-4 text-xl font-bold text-slate-900">Methode des 5 Pourquoi</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="flex gap-4 rounded-2xl bg-white/80 p-4 ring-1 ring-slate-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{index}</div>
                    <div className="flex-1">
                      <Input label={`Pourquoi ${index} ?`} required value={formData.causes[`why${index}`]} error={errors[`why${index}`]} onChange={(e) => updateSection("causes", `why${index}`, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                ["methode", "Methode"],
                ["mainDoeuvre", "Main d'oeuvre"],
                ["materiel", "Materiel"],
                ["milieu", "Milieu"],
                ["matiere", "Matiere"],
              ].map(([key, label]) => (
                <div key={key} className={classNames("rounded-3xl border border-violet-100 bg-violet-50/60 p-5", key === "matiere" ? "md:col-span-2" : "")}>
                  <Textarea label={label} required rows={key === "matiere" ? 4 : 5} value={formData.causes[key]} error={errors[key]} onChange={(e) => updateSection("causes", key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {currentStep === 4 ? (
          <div>
            <div className="mb-6 flex justify-end">
              <button type="button" onClick={() => setFormData((prev) => ({ ...prev, actions: [...prev.actions, emptyAction()] }))} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                <Plus className="h-4 w-4" />
                Ajouter Action
              </button>
            </div>
            <div className="space-y-5">
              {formData.actions.map((action, index) => (
                <ActionCard
                  key={`action-${index}`}
                  action={action}
                  index={index}
                  errors={errors}
                  onChange={updateAction}
                  canRemove={formData.actions.length > 1}
                  onRemove={() => setFormData((prev) => ({ ...prev, actions: prev.actions.filter((_, i) => i !== index) }))}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-0 z-10 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goPrevious}
            disabled={currentStep === 1}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Precedent
          </button>
          {currentStep === STEPS.length ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              <FileText className="h-4 w-4" />
              Enregistrer la Fiche
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
