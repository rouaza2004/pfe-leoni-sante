import { useMemo, useState } from "react";
import {
  Activity,
  Building2,
  Plus,
  Save,
  Settings2,
  Stethoscope,
  X,
} from "lucide-react";

const initialVisitTypes = [
  "Consultation",
  "Suivi",
  "Urgence",
  "Contrôle",
  "Vaccination",
];

const initialDepartments = [
  "Cardiologie",
  "Pédiatrie",
  "Neurologie",
  "Dermatologie",
  "Urgences",
  "Radiologie",
];

const initialStatusOptions = ["Pending", "Approved", "Rejected", "Cancelled"];

const initialPlatformSettings = {
  maintenanceMode: false,
  autoApproval: false,
  emailNotifications: true,
  twoFactorAuth: false,
  sessionTimeout: "30",
  maxLoginAttempts: "5",
};

function TagManagerCard({
  title,
  icon: Icon,
  iconStyle,
  tags,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
      <div className="flex items-center gap-3">
        <div
          className={[
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            iconStyle,
          ].join(" ")}
        >
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              aria-label={`Supprimer ${tag}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd();
            }
          }}
          placeholder="Ajouter..."
          className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
        />
        <button
          type="button"
          onClick={onAdd}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          aria-label={`Ajouter dans ${title}`}
        >
          <Plus size={18} />
        </button>
      </div>
    </section>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
        enabled ? "bg-sky-600" : "bg-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
          enabled ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export default function Parametres() {
  const [visitTypes, setVisitTypes] = useState(initialVisitTypes);
  const [departments, setDepartments] = useState(initialDepartments);
  const [statusOptions, setStatusOptions] = useState(initialStatusOptions);
  const [visitInput, setVisitInput] = useState("");
  const [departmentInput, setDepartmentInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [platformSettings, setPlatformSettings] = useState(initialPlatformSettings);
  const [feedback, setFeedback] = useState("");

  function addTag(value, items, setItems, clearInput) {
    const cleaned = value.trim();
    if (!cleaned) return;

    const exists = items.some((item) => item.toLowerCase() === cleaned.toLowerCase());
    if (exists) {
      clearInput("");
      return;
    }

    setItems((current) => [...current, cleaned]);
    clearInput("");
  }

  function removeTag(tag, setItems) {
    setItems((current) => current.filter((item) => item !== tag));
  }

  const settingRows = useMemo(
    () => [
      {
        key: "maintenanceMode",
        title: "Mode Maintenance",
        subtitle: "Désactiver l'accès utilisateur",
      },
      {
        key: "autoApproval",
        title: "Approbation Automatique",
        subtitle: "Approuver les RDV automatiquement",
      },
      {
        key: "emailNotifications",
        title: "Notifications Email",
        subtitle: "Envoyer des emails de notification",
      },
      {
        key: "twoFactorAuth",
        title: "Double Authentification",
        subtitle: "Exiger la 2FA pour les admins",
      },
    ],
    []
  );

  function handleSave() {
    setFeedback("Configuration sauvegardée avec succès.");
    window.setTimeout(() => {
      setFeedback("");
    }, 3000);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            Configuration Système
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gérez les données de référence et les paramètres de la plateforme
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
        >
          <Save size={18} />
          Sauvegarder
        </button>
      </div>

      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {feedback}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TagManagerCard
          title="Types de Visite"
          icon={Stethoscope}
          iconStyle="bg-sky-100 text-sky-700"
          tags={visitTypes}
          inputValue={visitInput}
          onInputChange={setVisitInput}
          onAdd={() => addTag(visitInput, visitTypes, setVisitTypes, setVisitInput)}
          onRemove={(tag) => removeTag(tag, setVisitTypes)}
        />

        <TagManagerCard
          title="Départements"
          icon={Building2}
          iconStyle="bg-violet-100 text-violet-700"
          tags={departments}
          inputValue={departmentInput}
          onInputChange={setDepartmentInput}
          onAdd={() =>
            addTag(departmentInput, departments, setDepartments, setDepartmentInput)
          }
          onRemove={(tag) => removeTag(tag, setDepartments)}
        />

        <TagManagerCard
          title="Options de Statut"
          icon={Activity}
          iconStyle="bg-emerald-100 text-emerald-700"
          tags={statusOptions}
          inputValue={statusInput}
          onInputChange={setStatusInput}
          onAdd={() => addTag(statusInput, statusOptions, setStatusOptions, setStatusInput)}
          onRemove={(tag) => removeTag(tag, setStatusOptions)}
        />

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Paramètres Plateforme</h2>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {settingRows.map((setting, index) => (
              <div
                key={setting.key}
                className={[
                  "flex items-center justify-between gap-4",
                  index !== settingRows.length - 1 ? "border-b border-slate-100 pb-5" : "",
                ].join(" ")}
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{setting.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{setting.subtitle}</p>
                </div>

                <Toggle
                  enabled={platformSettings[setting.key]}
                  onChange={() =>
                    setPlatformSettings((current) => ({
                      ...current,
                      [setting.key]: !current[setting.key],
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Timeout Session (min)
              </span>
              <input
                type="number"
                min="1"
                value={platformSettings.sessionTimeout}
                onChange={(event) =>
                  setPlatformSettings((current) => ({
                    ...current,
                    sessionTimeout: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Max Tentatives Connexion
              </span>
              <input
                type="number"
                min="1"
                value={platformSettings.maxLoginAttempts}
                onChange={(event) =>
                  setPlatformSettings((current) => ({
                    ...current,
                    maxLoginAttempts: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
