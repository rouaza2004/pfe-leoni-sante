import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FileText, Pill, Plus, Printer, RotateCcw, Save, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserRole, getUsername } from "@/controllers/auth/auth";
import {
  buildCertificatPrintHtml,
  buildOrdonnancePrintHtml,
} from "./CertificatOrdonnancePrintTemplate";
import { getCollaborateurs } from "@/models/collaborateurs/collaborateurs.api";

const STORAGE_KEY = "medecin-traitant-certificat-ordonnance-draft";

const createMedication = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  nomMedicament: "",
  posologie: "",
  duree: "",
  remarque: "",
});

const emptyMedication = {
  nomMedicament: "",
  posologie: "",
  duree: "",
  remarque: "",
};

const emptyCommonData = {
  nomPrenom: "",
  matricule: "",
  dateNaissance: "",
  dateConsultation: new Date().toISOString().slice(0, 10),
  lieuConsultation: "Menzel Hayet",
  diagnostic: "",
};

const emptyCertificatData = {
  nbJoursRepos: "",
  dateDebutRepos: "",
  dateFinRepos: "",
  commentaireComplications: "",
};

const emptyOrdonnanceData = {
  medicaments: [createMedication()],
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

const normalizeMedications = (items) => {
  if (!Array.isArray(items) || items.length === 0) return [createMedication()];

  return items.map((item) => ({
    id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nomMedicament: item.nomMedicament || item.medicament || "",
    posologie: item.posologie || "",
    duree: item.duree || "",
    remarque: item.remarque || "",
  }));
};

const formatDateLabel = (value) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR");
};

const normalizeSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getCollaborateurFullName = (collaborateur) =>
  [collaborateur?.nom, collaborateur?.prenom].filter(Boolean).join(" ").trim();

const getCollaborateurSearchText = (collaborateur) =>
  [
    collaborateur?.matricule,
    collaborateur?.nom,
    collaborateur?.prenom,
    getCollaborateurFullName(collaborateur),
    [collaborateur?.prenom, collaborateur?.nom].filter(Boolean).join(" ").trim(),
    collaborateur?.poste,
    collaborateur?.poste_nom,
    collaborateur?.departement,
    collaborateur?.site?.nom,
    collaborateur?.segment_nom,
    collaborateur?.segment?.nom,
  ]
    .filter(Boolean)
    .join(" ");

const getCollaborateurMeta = (collaborateur) =>
  [
    collaborateur?.site?.nom,
    collaborateur?.poste || collaborateur?.poste_nom,
    collaborateur?.segment_nom || collaborateur?.segment?.nom || collaborateur?.segment,
  ]
    .filter(Boolean)
    .join(" · ");

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
  const patientAutocompleteRef = useRef(null);

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

  const [documentType, setDocumentType] = useState(
    initialDraft?.type === "ordonnance" ? "ordonnance" : "certificat"
  );
  const [commonData, setCommonData] = useState(() => ({
    ...emptyCommonData,
    nomPrenom:
      prefilledPatient?.nomPrenom ||
      initialDraft?.nomPrenom ||
      emptyCommonData.nomPrenom,
    matricule:
      prefilledPatient?.matricule ||
      initialDraft?.matricule ||
      emptyCommonData.matricule,
    dateNaissance:
      prefilledPatient?.dateNaissance ||
      initialDraft?.dateNaissance ||
      emptyCommonData.dateNaissance,
    dateConsultation: initialDraft?.dateConsultation || emptyCommonData.dateConsultation,
    lieuConsultation: initialDraft?.lieuConsultation || emptyCommonData.lieuConsultation,
    diagnostic: initialDraft?.diagnostic || emptyCommonData.diagnostic,
  }));
  const [certificatData, setCertificatData] = useState(() => ({
    ...emptyCertificatData,
    nbJoursRepos: initialDraft?.nbJoursRepos || emptyCertificatData.nbJoursRepos,
    dateDebutRepos: initialDraft?.dateDebutRepos || emptyCertificatData.dateDebutRepos,
    dateFinRepos: initialDraft?.dateFinRepos || emptyCertificatData.dateFinRepos,
    commentaireComplications:
      initialDraft?.commentaireComplications ||
      emptyCertificatData.commentaireComplications,
  }));
  const [ordonnanceData, setOrdonnanceData] = useState(() => ({
    medicaments: normalizeMedications(initialDraft?.medicaments),
  }));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [savedAt, setSavedAt] = useState(() => initialDraft?.savedAt || "");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [collaborateursLoading, setCollaborateursLoading] = useState(false);
  const [collaborateursError, setCollaborateursError] = useState("");
  const [activePatientField, setActivePatientField] = useState(null);

  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    let cancelled = false;

    const loadCollaborateurs = async () => {
      try {
        setCollaborateursLoading(true);
        setCollaborateursError("");
        const result = await getCollaborateurs();
        if (cancelled) return;
        setCollaborateurs(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setCollaborateurs([]);
          setCollaborateursError("Impossible de charger les collaborateurs.");
        }
      } finally {
        if (!cancelled) setCollaborateursLoading(false);
      }
    };

    loadCollaborateurs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        patientAutocompleteRef.current &&
        !patientAutocompleteRef.current.contains(event.target)
      ) {
        setActivePatientField(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const showMessage = (type, value) => {
    setMessageType(type);
    setMessage(value);
  };

  const clearFeedback = () => {
    setMessage(null);
    setMessageType(null);
    setStatus("");
  };

  const updateCommonField = (name, value) => {
    setCommonData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if ((name === "nomPrenom" || name === "matricule") && !value.trim()) {
      setActivePatientField(null);
    }
    clearFeedback();
  };

  const patientSearchQuery =
    activePatientField === "matricule" ? commonData.matricule : commonData.nomPrenom;

  const patientSuggestions = useMemo(() => {
    const query = normalizeSearchText(patientSearchQuery);
    if (!query) return [];

    return collaborateurs
      .filter((collaborateur) =>
        normalizeSearchText(getCollaborateurSearchText(collaborateur)).includes(query)
      )
      .slice(0, 8);
  }, [collaborateurs, patientSearchQuery]);

  const shouldShowPatientDropdown =
    Boolean(activePatientField && patientSearchQuery.trim()) &&
    (collaborateursLoading ||
      collaborateursError ||
      patientSuggestions.length > 0 ||
      (!collaborateursLoading && patientSuggestions.length === 0));

  const shouldShowNoPatientResult =
    Boolean(activePatientField && patientSearchQuery.trim()) &&
    !collaborateursLoading &&
    !collaborateursError &&
    patientSuggestions.length === 0;

  const selectCollaborateur = (collaborateur) => {
    setCommonData((prev) => ({
      ...prev,
      nomPrenom: getCollaborateurFullName(collaborateur),
      matricule: collaborateur?.matricule || "",
      dateNaissance:
        collaborateur?.date_naissance ||
        collaborateur?.dateNaissance ||
        collaborateur?.dateNaissancePatient ||
        "",
    }));
    setErrors((prev) => ({ ...prev, nomPrenom: "", matricule: "", dateNaissance: "" }));
    setActivePatientField(null);
    clearFeedback();
  };

  const updateCertificatField = (name, value) => {
    setCertificatData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    clearFeedback();
  };

  const updateMedication = (index, name, value) => {
    setOrdonnanceData((prev) => ({
      ...prev,
      medicaments: prev.medicaments.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item
      ),
    }));
    setErrors((prev) => ({ ...prev, medicaments: "" }));
    clearFeedback();
  };

  const addMedicationRow = () => {
    setOrdonnanceData((prev) => ({
      ...prev,
      medicaments: [...prev.medicaments, createMedication()],
    }));
    clearFeedback();
  };

  const removeMedicationRow = (index) => {
    setOrdonnanceData((prev) => ({
      ...prev,
      medicaments:
        prev.medicaments.length === 1
          ? [createMedication()]
          : prev.medicaments.filter((_, itemIndex) => itemIndex !== index),
    }));
    clearFeedback();
  };

  const buildCurrentForm = () => ({
    type: documentType,
    ...commonData,
    ...certificatData,
    medicaments: ordonnanceData.medicaments,
  });

  const validate = () => {
    const form = buildCurrentForm();
    const nextErrors = {};

    if (!form.nomPrenom.trim()) nextErrors.nomPrenom = "Nom du patient requis.";
    if (!form.dateConsultation) {
      nextErrors.dateConsultation = "Date de consultation requise.";
    }

    if (documentType === "certificat") {
      if (!String(form.nbJoursRepos).trim()) {
        nextErrors.nbJoursRepos = "Nombre de jours requis.";
      } else if (
        !Number.isFinite(Number(form.nbJoursRepos)) ||
        Number(form.nbJoursRepos) <= 0
      ) {
        nextErrors.nbJoursRepos = "Le nombre de jours doit être supérieur à 0.";
      }
      if (!form.dateDebutRepos) {
        nextErrors.dateDebutRepos = "Date de début requise.";
      }
    }

    if (documentType === "ordonnance") {
      const hasMedicationName = ordonnanceData.medicaments.some((item) =>
        item.nomMedicament.trim()
      );
      const hasIncompleteMedication = ordonnanceData.medicaments.some(
        (item) =>
          (item.posologie.trim() || item.duree.trim() || item.remarque.trim()) &&
          !item.nomMedicament.trim()
      );

      if (!hasMedicationName) {
        nextErrors.medicaments = "Ajoutez au moins un médicament.";
      } else if (hasIncompleteMedication) {
        nextErrors.medicaments =
          "Chaque ligne renseignée doit contenir le nom du médicament.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPrintHtml = () => {
    const form = buildCurrentForm();
    const medicaments = ordonnanceData.medicaments.filter(
      (item) =>
        item.nomMedicament.trim() ||
        item.posologie.trim() ||
        item.duree.trim() ||
        item.remarque.trim()
    );

    return documentType === "certificat"
      ? buildCertificatPrintHtml({ doctor, form })
      : buildOrdonnancePrintHtml({
          doctor,
          form,
          medicaments: medicaments.length ? medicaments : [{ ...emptyMedication }],
        });
  };

  const openPrintableDocument = ({ autoPrint }) => {
    setMessage(null);
    setMessageType(null);

    if (!validate()) {
      showMessage(
        "error",
        "Veuillez compléter les champs obligatoires avant de générer le document."
      );
      return;
    }

    const popup = window.open("", "_blank", "width=900,height=1200");
    if (!popup) {
      setStatus("Autorisez les popups pour générer le document imprimable.");
      showMessage(
        "error",
        "Autorisez les popups pour générer le document imprimable."
      );
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

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);
      setMessage(null);
      setMessageType(null);
      setStatus("");

      if (!validate()) {
        showMessage(
          "error",
          "Veuillez compléter les champs obligatoires avant d'enregistrer."
        );
        return;
      }

      const payload = {
        ...buildCurrentForm(),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedAt(payload.savedAt);
      setStatus("Brouillon enregistré localement.");
      showMessage(
        "success",
        documentType === "certificat"
          ? "Certificat médical enregistré avec succès."
          : "Ordonnance enregistrée avec succès."
      );
    } catch (error) {
      console.error(error);
      showMessage(
        "error",
        "Une erreur est survenue pendant l'enregistrement. Veuillez réessayer."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDocumentType("certificat");
    setCommonData({
      ...emptyCommonData,
      nomPrenom: prefilledPatient?.nomPrenom || "",
      matricule: prefilledPatient?.matricule || "",
      dateNaissance: prefilledPatient?.dateNaissance || "",
    });
    setCertificatData({ ...emptyCertificatData });
    setOrdonnanceData({ medicaments: [createMedication()] });
    setErrors({});
    setMessage(null);
    setMessageType(null);
    setActivePatientField(null);
    setSavedAt("");
    setStatus("Formulaire réinitialisé.");
    localStorage.removeItem(STORAGE_KEY);
  };

  const documentTypeLabel =
    documentType === "certificat" ? "Certificat médical" : "Ordonnance";
  const alertClassName =
    messageType === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700";

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
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : "Enregistrer"}
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
              onClick={() => {
                setDocumentType("certificat");
                setErrors({});
                clearFeedback();
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                documentType === "certificat"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Certificat médical
            </button>
            <button
              type="button"
              onClick={() => {
                setDocumentType("ordonnance");
                setErrors({});
                clearFeedback();
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                documentType === "ordonnance"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Ordonnance
            </button>
          </div>
        </div>

        {message ? (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${alertClassName}`}
            role="alert"
          >
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Section patient</h2>
              <p className="mt-1 text-xs text-slate-500">
                Informations utilisées dans le document imprimable.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div ref={patientAutocompleteRef} className="relative md:col-span-2">
                <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom et prénom" required>
                <Input
                  value={commonData.nomPrenom}
                  onFocus={() => {
                    if (commonData.nomPrenom.trim()) setActivePatientField("nomPrenom");
                  }}
                  onChange={(event) => {
                    setActivePatientField("nomPrenom");
                    updateCommonField("nomPrenom", event.target.value);
                  }}
                  placeholder="Nom complet du patient"
                  autoComplete="off"
                />
                {errors.nomPrenom ? (
                  <p className="mt-1 text-xs text-red-600">{errors.nomPrenom}</p>
                ) : null}
              </Field>

              <Field label="Matricule">
                <Input
                  value={commonData.matricule}
                  onFocus={() => {
                    if (commonData.matricule.trim()) setActivePatientField("matricule");
                  }}
                  onChange={(event) => {
                    setActivePatientField("matricule");
                    updateCommonField("matricule", event.target.value);
                  }}
                  placeholder="Matricule patient"
                  autoComplete="off"
                />
              </Field>

                </div>

                {shouldShowPatientDropdown ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
                    {collaborateursLoading ? (
                      <p className="px-4 py-3 text-sm text-slate-500">Chargement...</p>
                    ) : null}

                    {!collaborateursLoading && collaborateursError ? (
                      <p className="px-4 py-3 text-sm text-red-600">{collaborateursError}</p>
                    ) : null}

                    {!collaborateursLoading && !collaborateursError ? (
                      <div className="max-h-72 overflow-y-auto py-1">
                        {patientSuggestions.map((collaborateur) => {
                          const meta = getCollaborateurMeta(collaborateur);

                          return (
                            <button
                              key={collaborateur.id || collaborateur.matricule}
                              type="button"
                              onClick={() => selectCollaborateur(collaborateur)}
                              className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  {collaborateur.matricule || "--"}
                                </span>
                                <span className="text-sm font-semibold text-slate-900">
                                  {getCollaborateurFullName(collaborateur) || "--"}
                                </span>
                              </div>
                              {meta ? (
                                <p className="mt-1 text-xs text-slate-500">{meta}</p>
                              ) : null}
                            </button>
                          );
                        })}

                        {shouldShowNoPatientResult ? (
                          <p className="px-4 py-3 text-sm text-slate-500">
                            Aucun collaborateur trouvé
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <Field label="Date de naissance">
                <Input
                  type="date"
                  value={commonData.dateNaissance}
                  onChange={(event) => updateCommonField("dateNaissance", event.target.value)}
                />
              </Field>

              <Field label="Date de consultation" required>
                <Input
                  type="date"
                  value={commonData.dateConsultation}
                  onChange={(event) =>
                    updateCommonField("dateConsultation", event.target.value)
                  }
                />
                {errors.dateConsultation ? (
                  <p className="mt-1 text-xs text-red-600">{errors.dateConsultation}</p>
                ) : null}
              </Field>

              <Field label="Lieu de consultation">
                <Input
                  value={commonData.lieuConsultation}
                  onChange={(event) =>
                    updateCommonField("lieuConsultation", event.target.value)
                  }
                />
              </Field>

              <Field label="Diagnostic / observation" hint="Imprimé dans le document">
                <Textarea
                  rows={5}
                  value={commonData.diagnostic}
                  onChange={(event) => updateCommonField("diagnostic", event.target.value)}
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
                {formatDateLabel(commonData.dateConsultation)}
              </p>
            </div>
          </div>
        </div>

        {documentType === "certificat" ? (
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
                  value={certificatData.nbJoursRepos}
                  onChange={(event) =>
                    updateCertificatField("nbJoursRepos", event.target.value)
                  }
                  placeholder="Ex. 3"
                />
                {errors.nbJoursRepos ? (
                  <p className="mt-1 text-xs text-red-600">{errors.nbJoursRepos}</p>
                ) : null}
              </Field>

              <Field label="Date début repos" required>
                <Input
                  type="date"
                  value={certificatData.dateDebutRepos}
                  onChange={(event) =>
                    updateCertificatField("dateDebutRepos", event.target.value)
                  }
                />
                {errors.dateDebutRepos ? (
                  <p className="mt-1 text-xs text-red-600">{errors.dateDebutRepos}</p>
                ) : null}
              </Field>

              <Field label="Date fin repos">
                <Input
                  type="date"
                  value={certificatData.dateFinRepos}
                  onChange={(event) =>
                    updateCertificatField("dateFinRepos", event.target.value)
                  }
                />
              </Field>

              <Field label="Commentaire complications">
                <Textarea
                  rows={5}
                  value={certificatData.commentaireComplications}
                  onChange={(event) =>
                    updateCertificatField("commentaireComplications", event.target.value)
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
              {ordonnanceData.medicaments.map((item, index) => (
                <div
                  key={item.id}
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


