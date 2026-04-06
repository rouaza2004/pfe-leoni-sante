import { useMemo, useState } from "react";
import { ArrowLeft, FileText, Pill, Plus, Printer, RotateCcw, Save, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserRole, getUsername } from "@/auth/auth";
import {
  buildCertificatPrintHtml,
  buildOrdonnancePrintHtml,
} from "./CertificatOrdonnancePrintTemplate";

const STORAGE_KEY = "medecin-traitant-certificat-ordonnance-draft";

const emptyMedication = {
  nomMedicament: "",
  posologie: "",
  duree: "",
  remarque: "",
};

const emptyForm = {
  type: "certificat",
  nomPrenom: "",
  matricule: "",
  dateNaissance: "",
  dateConsultation: new Date().toISOString().slice(0, 10),
  lieuConsultation: "Menzel Hayet",
  diagnostic: "",
  nbJoursRepos: "",
  dateDebutRepos: "",
  dateFinRepos: "",
  commentaireComplications: "",
  medicaments: [{ ...emptyMedication }],
};

const specialityByRole = {
  MEDECIN_TRAITANT: "Médecine Générale",
  MEDECIN_TRAVAIL: "Médecin du travail",
  MEDECIN_CONTROLEUR: "Médecin contrôleur",
};

const arabicSpecialityByRole = {
  MEDECIN_TRAITANT: "طب عام",
  MEDECIN_TRAVAIL: "طب الشغل",
  MEDECIN_CONTROLEUR: "طب المراقبة",
};

const tryParseStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const formatDateLabel = (value) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR");
};

function getDoctorIdentity(role) {
  const fallbackUsername = getUsername();
  const storedUser =
    tryParseStorage("user") ||
    tryParseStorage("profile") ||
    tryParseStorage("currentUser") ||
    null;

  const first =
    storedUser?.first_name ||
    storedUser?.firstName ||
    storedUser?.prenom ||
    storedUser?.user?.prenom ||
    "";
  const last =
    storedUser?.last_name ||
    storedUser?.lastName ||
    storedUser?.nom ||
    storedUser?.user?.nom ||
    "";
  const fullName =
    storedUser?.full_name ||
    storedUser?.fullName ||
    storedUser?.name ||
    storedUser?.doctor_name ||
    storedUser?.medecin_name ||
    storedUser?.profile?.name ||
    `${first} ${last}`.trim() ||
    fallbackUsername ||
    "Docteur";

  const speciality =
    storedUser?.speciality ||
    storedUser?.specialite ||
    storedUser?.specialty ||
    storedUser?.profile?.speciality ||
    storedUser?.profile?.specialite ||
    specialityByRole[role] ||
    "Médecin";

  const arabicName =
    storedUser?.arabic_name ||
    storedUser?.name_ar ||
    storedUser?.profile?.arabic_name ||
    "";

  return {
    name: fullName,
    speciality,
    arabicName,
    arabicSpeciality: arabicSpecialityByRole[role] || "طب",
  };
}

function Field({ label, required = false, children, hint }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">
          {label}
          {required ? " *" : ""}
        </span>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 ${props.className || ""}`.trim()}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 ${props.className || ""}`.trim()}
    />
  );
}

export default function CertificatOrdonnancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();

  const doctor = useMemo(() => getDoctorIdentity(role), [role]);

  const initialDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  const prefilledPatient = location.state?.patient || null;

  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...initialDraft,
    nomPrenom:
      prefilledPatient?.nomPrenom ||
      initialDraft?.nomPrenom ||
      emptyForm.nomPrenom,
    matricule:
      prefilledPatient?.matricule ||
      initialDraft?.matricule ||
      emptyForm.matricule,
    dateNaissance:
      prefilledPatient?.dateNaissance ||
      initialDraft?.dateNaissance ||
      emptyForm.dateNaissance,
    medicaments:
      initialDraft?.medicaments?.length > 0
        ? initialDraft.medicaments
        : emptyForm.medicaments,
  }));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [savedAt, setSavedAt] = useState(() => initialDraft?.savedAt || "");

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setStatus("");
  };

  const updateMedication = (index, name, value) => {
    setForm((prev) => ({
      ...prev,
      medicaments: prev.medicaments.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item
      ),
    }));
    setErrors((prev) => ({ ...prev, medicaments: "" }));
    setStatus("");
  };

  const addMedicationRow = () => {
    setForm((prev) => ({
      ...prev,
      medicaments: [...prev.medicaments, { ...emptyMedication }],
    }));
  };

  const removeMedicationRow = (index) => {
    setForm((prev) => ({
      ...prev,
      medicaments:
        prev.medicaments.length === 1
          ? [{ ...emptyMedication }]
          : prev.medicaments.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.nomPrenom.trim()) nextErrors.nomPrenom = "Nom du patient requis.";
    if (!form.dateConsultation) {
      nextErrors.dateConsultation = "Date de consultation requise.";
    }

    if (form.type === "certificat") {
      if (!String(form.nbJoursRepos).trim()) {
        nextErrors.nbJoursRepos = "Nombre de jours requis.";
      }
      if (!form.dateDebutRepos) {
        nextErrors.dateDebutRepos = "Date de début requise.";
      }
    }

    if (form.type === "ordonnance") {
      const hasMedication = form.medicaments.some(
        (item) =>
          item.nomMedicament.trim() ||
          item.posologie.trim() ||
          item.duree.trim() ||
          item.remarque.trim()
      );

      if (!hasMedication) {
        nextErrors.medicaments = "Ajoutez au moins un médicament.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPrintHtml = () => {
    const medicaments = form.medicaments.filter(
      (item) =>
        item.nomMedicament.trim() ||
        item.posologie.trim() ||
        item.duree.trim() ||
        item.remarque.trim()
    );

    return form.type === "certificat"
      ? buildCertificatPrintHtml({ doctor, form })
      : buildOrdonnancePrintHtml({
          doctor,
          form,
          medicaments: medicaments.length ? medicaments : [{ ...emptyMedication }],
        });
  };

  const openPrintableDocument = ({ autoPrint }) => {
    if (!validate()) return;

    const popup = window.open("", "_blank", "width=900,height=1200");
    if (!popup) {
      setStatus("Autorisez les popups pour générer le document imprimable.");
      return;
    }

    const html = buildPrintHtml();
    popup.document.open();
    popup.document.write(html);
    popup.document.close();

    popup.onload = () => {
      popup.focus();
      if (autoPrint) {
        popup.print();
      }
    };

    setStatus(
      autoPrint
        ? "Document imprimable ouvert."
        : "Aperçu PDF ouvert. Utilisez Imprimer > Enregistrer en PDF."
    );
  };

  const handleSave = () => {
    const payload = {
      ...form,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSavedAt(payload.savedAt);
    setStatus("Brouillon enregistré localement.");
  };

  const handleReset = () => {
    setForm({
      ...emptyForm,
      nomPrenom: prefilledPatient?.nomPrenom || "",
      matricule: prefilledPatient?.matricule || "",
      dateNaissance: prefilledPatient?.dateNaissance || "",
    });
    setErrors({});
    setSavedAt("");
    setStatus("Formulaire réinitialisé.");
    localStorage.removeItem(STORAGE_KEY);
  };

  const documentTypeLabel =
    form.type === "certificat" ? "Certificat médical" : "Ordonnance";

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/medecin-traitant")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Retour au dashboard
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={() => openPrintableDocument({ autoPrint: false })}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FileText size={16} />
            Générer PDF
          </button>
          <button
            type="button"
            onClick={() => openPrintableDocument({ autoPrint: true })}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Printer size={16} />
            Imprimer
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Save size={16} />
            Enregistrer
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Certificat / Ordonnance
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Préparez un {documentTypeLabel.toLowerCase()} imprimable à partir d&apos;un
              formulaire simple.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateField("type", "certificat")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                form.type === "certificat"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Certificat médical
            </button>
            <button
              type="button"
              onClick={() => updateField("type", "ordonnance")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                form.type === "ordonnance"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Ordonnance
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Section patient</h2>
              <p className="mt-1 text-xs text-slate-500">
                Informations utilisées dans le document imprimable.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom et prénom" required>
                <Input
                  value={form.nomPrenom}
                  onChange={(event) => updateField("nomPrenom", event.target.value)}
                  placeholder="Nom complet du patient"
                />
                {errors.nomPrenom ? (
                  <p className="mt-1 text-xs text-red-600">{errors.nomPrenom}</p>
                ) : null}
              </Field>

              <Field label="Matricule">
                <Input
                  value={form.matricule}
                  onChange={(event) => updateField("matricule", event.target.value)}
                  placeholder="Matricule patient"
                />
              </Field>

              <Field label="Date de naissance">
                <Input
                  type="date"
                  value={form.dateNaissance}
                  onChange={(event) => updateField("dateNaissance", event.target.value)}
                />
              </Field>

              <Field label="Date de consultation" required>
                <Input
                  type="date"
                  value={form.dateConsultation}
                  onChange={(event) => updateField("dateConsultation", event.target.value)}
                />
                {errors.dateConsultation ? (
                  <p className="mt-1 text-xs text-red-600">{errors.dateConsultation}</p>
                ) : null}
              </Field>

              <Field label="Lieu de consultation">
                <Input
                  value={form.lieuConsultation}
                  onChange={(event) => updateField("lieuConsultation", event.target.value)}
                />
              </Field>

              <Field label="Diagnostic / observation" hint="Imprimé dans le document">
                <Textarea
                  rows={5}
                  value={form.diagnostic}
                  onChange={(event) => updateField("diagnostic", event.target.value)}
                  placeholder="Observation clinique, diagnostic ou motif..."
                />
              </Field>
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Médecin connecté</h2>
              <p className="mt-1 text-xs text-slate-500">
                Injecté automatiquement depuis la source d&apos;auth existante.
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-xs font-medium text-slate-500">Nom affiché</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{doctor.name}</p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-xs font-medium text-slate-500">Spécialité affichée</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{doctor.speciality}</p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-xs font-medium text-slate-500">Date affichée</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDateLabel(form.dateConsultation)}
              </p>
            </div>
          </div>
        </div>

        {form.type === "certificat" ? (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Section certificat</h2>
              <p className="mt-1 text-xs text-slate-500">
                Les champs ci-dessous alimentent le certificat médical imprimable.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nombre de jours de repos" required>
                <Input
                  type="number"
                  min="1"
                  value={form.nbJoursRepos}
                  onChange={(event) => updateField("nbJoursRepos", event.target.value)}
                  placeholder="Ex. 3"
                />
                {errors.nbJoursRepos ? (
                  <p className="mt-1 text-xs text-red-600">{errors.nbJoursRepos}</p>
                ) : null}
              </Field>

              <Field label="Date début repos" required>
                <Input
                  type="date"
                  value={form.dateDebutRepos}
                  onChange={(event) => updateField("dateDebutRepos", event.target.value)}
                />
                {errors.dateDebutRepos ? (
                  <p className="mt-1 text-xs text-red-600">{errors.dateDebutRepos}</p>
                ) : null}
              </Field>

              <Field label="Date fin repos">
                <Input
                  type="date"
                  value={form.dateFinRepos}
                  onChange={(event) => updateField("dateFinRepos", event.target.value)}
                />
              </Field>

              <Field label="Commentaire complications">
                <Textarea
                  rows={5}
                  value={form.commentaireComplications}
                  onChange={(event) =>
                    updateField("commentaireComplications", event.target.value)
                  }
                  placeholder="Commentaire complémentaire si nécessaire..."
                />
              </Field>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Section ordonnance</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Ajoutez une ou plusieurs lignes de médicaments.
                </p>
              </div>

              <button
                type="button"
                onClick={addMedicationRow}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Plus size={16} />
                Ajouter un médicament
              </button>
            </div>

            {errors.medicaments ? (
              <p className="mt-3 text-xs text-red-600">{errors.medicaments}</p>
            ) : null}

            <div className="mt-4 space-y-3">
              {form.medicaments.map((item, index) => (
                <div
                  key={`${index}-${item.nomMedicament}`}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_160px_auto]">
                    <Field label="Médicament">
                      <div className="flex items-center gap-2">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
                          <Pill size={18} />
                        </div>
                        <Input
                          value={item.nomMedicament}
                          onChange={(event) =>
                            updateMedication(index, "nomMedicament", event.target.value)
                          }
                          placeholder="Nom du médicament"
                        />
                      </div>
                    </Field>

                    <Field label="Posologie">
                      <Input
                        value={item.posologie}
                        onChange={(event) =>
                          updateMedication(index, "posologie", event.target.value)
                        }
                        placeholder="1 cp x 2/j"
                      />
                    </Field>

                    <Field label="Durée">
                      <Input
                        value={item.duree}
                        onChange={(event) =>
                          updateMedication(index, "duree", event.target.value)
                        }
                        placeholder="5 jours"
                      />
                    </Field>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeMedicationRow(index)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                        aria-label="Supprimer la ligne"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Field label="Remarque">
                      <Textarea
                        rows={3}
                        value={item.remarque}
                        onChange={(event) =>
                          updateMedication(index, "remarque", event.target.value)
                        }
                        placeholder="Remarque complémentaire..."
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>{status || "Le document imprimé utilise un template A4 dédié, séparé de l'UI écran."}</p>
          <p>
            {savedAt
              ? `Dernier enregistrement : ${new Date(savedAt).toLocaleString("fr-FR")}`
              : "Aucun brouillon enregistré."}
          </p>
        </div>
      </div>
    </div>
  );
}
