import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, FileDown, RotateCcw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/api";

const Input = ({ label, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
    />
  </label>
);

const TextArea = ({ label, rows = 5, ...props }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <textarea
      {...props}
      rows={rows}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
    />
  </label>
);

const CheckboxField = ({ label, name, checked, onChange }) => (
  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
    <input type="checkbox" name={name} checked={checked} onChange={onChange} />
    <span>{label}</span>
  </label>
);

const SectionCard = ({ title, children, hint }) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
    {children}
  </section>
);

function calcAge(dateString) {
  if (!dateString) return "";
  const birthDate = new Date(dateString);
  if (Number.isNaN(birthDate.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age > 0 ? String(age) : "";
}

function createDefaultForm(todayISO) {
  return {
    numeroLabo: "",
    date: todayISO,
    nomPrenom: "",
    age: "",
    matricule: "",
    cin: "",
    gsm: "",
    entreprise: "",
    posteTravail: "",
    renseignementsCliniques: "",
    visiotest: false,
    audiogramme: false,
    ecg: false,
    efr: false,
  };
}

function openBlob(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function resolveApiErrorMessage(error, fallbackMessage) {
  const status = error?.response?.status;

  if (status === 401) {
    return "Votre session a expiré. Merci de vous reconnecter.";
  }
  if (status === 403) {
    return "Vous n'avez pas l'autorisation d'accéder à cet examen complémentaire.";
  }
  if (status === 404) {
    return "Aucune donnée trouvée pour ce collaborateur.";
  }
  if (status === 500) {
    return "Le serveur a rencontré une erreur pendant le chargement.";
  }
  if (error?.message === "Network Error") {
    return "Impossible de joindre le serveur pour charger les informations du collaborateur.";
  }

  return fallbackMessage;
}

export default function ExamenComplementaireForm({
  collaborateurId: collaborateurIdProp = null,
  embedded = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const collaborateurId = Number(collaborateurIdProp || id);

  const todayISO = useMemo(() => {
    const currentDate = new Date();
    const pad = (value) => `${value}`.padStart(2, "0");
    return `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(
      currentDate.getDate(),
    )}`;
  }, []);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [collab, setCollab] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [lastExamId, setLastExamId] = useState(null);
  const [form, setForm] = useState(() => createDefaultForm(todayISO));

  useEffect(() => {
    let cancelled = false;

    async function fetchCollaborateurData() {
      if (!Number.isFinite(collaborateurId) || collaborateurId <= 0) {
        setErr("Collaborateur introuvable.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErr("");
        setSuccess("");

        const [collabResponse, dossierResponse] = await Promise.all([
          api.get(`/collaborateurs/${collaborateurId}/`),
          api.get(`/medical/dossier/${collaborateurId}/`),
        ]);

        if (cancelled) return;

        const nextCollab = collabResponse.data || {};
        const nextDossier = dossierResponse.data || {};

        setCollab(nextCollab);
        setDossier(nextDossier);
        setForm((current) => ({
          ...current,
          nomPrenom: `${nextCollab.prenom || ""} ${nextCollab.nom || ""}`.trim(),
          age: calcAge(nextCollab.date_naissance),
          matricule: nextCollab.matricule || "",
          cin: nextCollab.cin || "",
          gsm: nextCollab.telephone || "",
          entreprise: nextDossier.entreprise || nextCollab.site?.nom || "",
          posteTravail: nextCollab.poste || nextDossier.poste_travail_actuel || "",
        }));
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setErr(
            resolveApiErrorMessage(
              error,
              "Impossible de charger les informations du collaborateur."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCollaborateurData();
    return () => {
      cancelled = true;
    };
  }, [collaborateurId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleReset = () => {
    setForm({
      ...createDefaultForm(todayISO),
      nomPrenom: `${collab?.prenom || ""} ${collab?.nom || ""}`.trim(),
      age: calcAge(collab?.date_naissance),
      matricule: collab?.matricule || "",
      cin: collab?.cin || "",
      gsm: collab?.telephone || "",
      entreprise: dossier?.entreprise || collab?.site?.nom || "",
      posteTravail: collab?.poste || dossier?.poste_travail_actuel || "",
    });
    setErr("");
    setSuccess("");
  };

  const buildPayload = () => ({
    nom_prenom: form.nomPrenom.trim(),
    age: form.age.trim(),
    cin: form.cin.trim(),
    entreprise: form.entreprise.trim(),
    poste_travail: form.posteTravail.trim(),
    renseignements_cliniques: form.renseignementsCliniques.trim(),
    visiotest: form.visiotest,
    audiogramme: form.audiogramme,
    ecg: form.ecg,
    efr: form.efr,
  });

  const handleGeneratePdf = async () => {
    if (!Number.isFinite(collaborateurId) || collaborateurId <= 0) {
      setErr("Collaborateur introuvable.");
      return;
    }

    try {
      setBusy(true);
      setErr("");
      setSuccess("");

      const createResponse = await api.post(
        `/medical/examens-complementaires/${collaborateurId}/`,
        buildPayload(),
      );

      const createdExam = createResponse.data || {};
      const createdId = createdExam.id;

      if (!createdId) {
        throw new Error("Aucun identifiant d'examen complementaire retourne par l'API.");
      }

      setLastExamId(createdId);
      setForm((current) => ({
        ...current,
        numeroLabo: String(createdId),
      }));

      const pdfResponse = await api.get(`/medical/examens-complementaires/${createdId}/pdf/`, {
        responseType: "blob",
      });

      openBlob(pdfResponse.data);
      setSuccess("Examen complémentaire enregistré et PDF généré avec succès.");
    } catch (error) {
      console.error(error);
      setErr(
        resolveApiErrorMessage(
          error,
          "Impossible d'enregistrer l'examen complémentaire ou de générer le PDF."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadLatestPdf = async () => {
    if (!lastExamId) return;

    try {
      setBusy(true);
      setErr("");

      const pdfResponse = await api.get(`/medical/examens-complementaires/${lastExamId}/pdf/`, {
        responseType: "blob",
      });

      downloadBlob(
        pdfResponse.data,
        `examen-complementaire-${form.matricule || collaborateurId}-${lastExamId}.pdf`,
      );
    } catch (error) {
      console.error(error);
      setErr(resolveApiErrorMessage(error, "Impossible de télécharger le dernier PDF généré."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-500">Chargement du formulaire...</div>;
  }

  return (
    <div className={embedded ? "space-y-6" : "space-y-6 p-6"}>
      {!embedded ? (
        <button
          type="button"
          onClick={() => navigate("/medecin-travail/collaborateurs")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux collaborateurs
        </button>
      ) : null}

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Examens complémentaires</h1>
            <p className="text-sm text-slate-500">
              Remplissez le formulaire puis générez le PDF depuis le backend Django.
            </p>
          </div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{err}</div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <SectionCard
              title="Formulaire"
              hint="Les informations du collaborateur sont préremplies automatiquement quand elles sont disponibles."
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Input
                  label="N° du labo"
                  name="numeroLabo"
                  value={form.numeroLabo}
                  onChange={handleChange}
                  placeholder="Attribué après enregistrement"
                />
                <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
                <Input
                  label="Nom et prénom"
                  name="nomPrenom"
                  value={form.nomPrenom}
                  onChange={handleChange}
                />
                <Input label="Âge" name="age" value={form.age} onChange={handleChange} />
                <Input
                  label="Matricule"
                  name="matricule"
                  value={form.matricule}
                  onChange={handleChange}
                />
                <Input label="CIN" name="cin" value={form.cin} onChange={handleChange} />
                <Input label="GSM" name="gsm" value={form.gsm} onChange={handleChange} />
                <Input
                  label="Entreprise"
                  name="entreprise"
                  value={form.entreprise}
                  onChange={handleChange}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Poste de travail"
                    name="posteTravail"
                    value={form.posteTravail}
                    onChange={handleChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <TextArea
                    label="Renseignements cliniques"
                    name="renseignementsCliniques"
                    value={form.renseignementsCliniques}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Examens complémentaires">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CheckboxField
                  label="Visiotest"
                  name="visiotest"
                  checked={form.visiotest}
                  onChange={handleChange}
                />
                <CheckboxField
                  label="Audiogramme"
                  name="audiogramme"
                  checked={form.audiogramme}
                  onChange={handleChange}
                />
                <CheckboxField label="ECG" name="ecg" checked={form.ecg} onChange={handleChange} />
                <CheckboxField label="EFR" name="efr" checked={form.efr} onChange={handleChange} />
              </div>
            </SectionCard>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                <Activity className="h-4 w-4" />
                Générer PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadLatestPdf}
                disabled={busy || !lastExamId}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <FileDown className="h-4 w-4" />
                Télécharger le dernier PDF
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <SectionCard title="Collaborateur">
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-900">Nom :</span>{" "}
                  {form.nomPrenom || "Non renseigné"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Matricule :</span>{" "}
                  {form.matricule || "Non renseigné"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">CIN :</span> {form.cin || "Non renseigné"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">GSM :</span> {form.gsm || "Non renseigné"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Entreprise :</span>{" "}
                  {form.entreprise || "Non renseignée"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Poste :</span>{" "}
                  {form.posteTravail || "Non renseigné"}
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="Comportement"
              hint="Chaque génération crée un enregistrement backend lié au collaborateur, puis ouvre le PDF retourné par Django."
            >
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>1. Le formulaire se remplit automatiquement à partir du collaborateur et de son dossier.</p>
                <p>2. Le bouton Générer PDF enregistre l’examen complémentaire dans la base.</p>
                <p>3. Le PDF ReportLab s’ouvre ensuite dans un nouvel onglet.</p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}

