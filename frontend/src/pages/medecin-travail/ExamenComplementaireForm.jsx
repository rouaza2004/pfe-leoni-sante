import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Eye,
  FileDown,
  ImageUp,
  Printer,
  RotateCcw,
} from "lucide-react";
import { api } from "@/api/api";
import { generateExamenComplementairePdf } from "@/utils/generateExamenComplementairePdf";

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

function calcAge(dateNaissance) {
  if (!dateNaissance) return "";
  const birth = new Date(dateNaissance);
  if (Number.isNaN(birth.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return String(age);
}

function toObjectUrl(file) {
  return file ? URL.createObjectURL(file) : "";
}

export default function ExamenComplementaireForm({
  collaborateurId: collaborateurIdProp = null,
  embedded = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const collaborateurId = Number(collaborateurIdProp || id);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [collab, setCollab] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);

  const todayISO = useMemo(() => {
    const currentDate = new Date();
    const pad = (value) => `${value}`.padStart(2, "0");
    return `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(
      currentDate.getDate(),
    )}`;
  }, []);

  const [form, setForm] = useState({
    nomPrenom: "",
    age: "",
    entreprise: "",
    posteTravail: "",
    renseignementsCliniques: "",
    date: todayISO,
    visiotest: false,
    audiogramme: false,
    ecg: false,
    efr: false,
  });

  useEffect(() => {
    let cancelled = false;

    const loadCollaborateur = async () => {
      try {
        setLoading(true);
        setErr("");

        const [collabResponse, dossierResponse] = await Promise.all([
          api.get(`/collaborateurs/${collaborateurId}/`),
          api.get(`/medical/dossier/${collaborateurId}/`),
        ]);

        if (cancelled) return;

        const nextCollab = collabResponse.data || {};
        const dossier = dossierResponse.data || {};

        setCollab(nextCollab);
        setForm((current) => ({
          ...current,
          nomPrenom: `${nextCollab.prenom || ""} ${nextCollab.nom || ""}`.trim(),
          age: calcAge(nextCollab.date_naissance),
          entreprise: dossier.entreprise || nextCollab.site?.nom || "",
          posteTravail: nextCollab.poste || dossier.poste_travail_actuel || "",
        }));
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setErr("Impossible de charger les informations du collaborateur.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCollaborateur();

    return () => {
      cancelled = true;
    };
  }, [collaborateurId]);

  const previewUrl = useMemo(() => toObjectUrl(backgroundFile), [backgroundFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleReset = () => {
    setForm({
      nomPrenom: `${collab?.prenom || ""} ${collab?.nom || ""}`.trim(),
      age: calcAge(collab?.date_naissance),
      entreprise: collab?.site?.nom || "",
      posteTravail: collab?.poste || "",
      renseignementsCliniques: "",
      date: todayISO,
      visiotest: false,
      audiogramme: false,
      ecg: false,
      efr: false,
    });
    setBackgroundFile(null);
    setErr("");
  };

  const buildPdfPayload = () => ({
    ...form,
    backgroundImage: backgroundFile,
  });

  const withPdfAction = async (action) => {
    if (!backgroundFile) {
      setErr("Ajoutez d'abord l'image scannee du formulaire pour conserver le fond papier.");
      return;
    }

    try {
      setBusy(true);
      setErr("");
      const pdf = await generateExamenComplementairePdf(buildPdfPayload());
      action(pdf);
      window.setTimeout(() => pdf.revoke(), 20000);
    } catch (error) {
      console.error(error);
      setErr("Impossible de generer le PDF du formulaire.");
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Medecin du travail</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Demande d'examens complementaires
            </h1>
            <p className="mt-2 text-slate-500">
              Collaborateur :
              <span className="ml-2 font-medium text-slate-700">
                {form.nomPrenom || "Non renseigne"}
              </span>
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
            <Activity className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{err}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SectionCard
            title="Formulaire"
            hint="Le PDF sera genere sur une page A4 portrait avec le formulaire scanne en fond."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input
                label="Nom et prenom"
                name="nomPrenom"
                value={form.nomPrenom}
                onChange={handleChange}
              />
              <Input label="Age" name="age" value={form.age} onChange={handleChange} />
              <Input
                label="Entreprise"
                name="entreprise"
                value={form.entreprise}
                onChange={handleChange}
              />
              <Input
                label="Poste de travail"
                name="posteTravail"
                value={form.posteTravail}
                onChange={handleChange}
              />
              <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} />
              <div />
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

          <SectionCard title="Cases a cocher">
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

          <SectionCard
            title="Fond du formulaire"
            hint="Importez l'image A4 scannee du modele papier. C'est cette image qui sera gardee telle quelle dans le PDF."
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100">
              <ImageUp className="h-5 w-5" />
              <span>{backgroundFile ? backgroundFile.name : "Choisir l'image scannee"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(event) => setBackgroundFile(event.target.files?.[0] || null)}
              />
            </label>
          </SectionCard>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => withPdfAction((pdf) => pdf.open())}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <Eye className="h-4 w-4" />
              Ouvrir le PDF
            </button>
            <button
              type="button"
              onClick={() =>
                withPdfAction((pdf) =>
                  pdf.download(
                    `examen-complementaire-${(collab?.matricule || collaborateurId).toString()}.pdf`,
                  ),
                )
              }
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" />
              Telecharger
            </button>
            <button
              type="button"
              onClick={() => withPdfAction((pdf) => pdf.print())}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reinitialiser
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Apercu du fond"
            hint="Cet apercu sert uniquement a verifier que le scan charge est bien le bon document."
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Apercu du formulaire scanne"
                className="w-full rounded-2xl border border-slate-200 object-contain shadow-sm"
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Aucune image scannee selectionnee.
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Conseil de placement"
            hint="Les coordonnees du texte sont centralisees dans generateExamenComplementairePdf.js."
          >
            <div className="space-y-3 text-sm leading-6 text-slate-600">
              <p>
                1. Chargez votre scan A4 propre, bien droit et de bonne resolution.
              </p>
              <p>
                2. Generez un premier PDF test et comparez-le au modele papier.
              </p>
              <p>
                3. Ajustez ensuite les positions dans l'objet <code>PDF_POSITIONS</code> pour un rendu
                parfaitement aligne.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
