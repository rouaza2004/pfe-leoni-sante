import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  FileText,
  Paperclip,
  Printer,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { api } from "@/api/api";
import { getUsername } from "../../auth/auth";

const SOCIETE_PAR_DEFAUT = "SOCIETE LEONI WIRING SYSTEMS TUNISIA SARL";

const MISSION_PAR_DEFAUT = [
  "Examiner l’intéressé(e).",
  "Préciser si le repos prescrit par son médecin traitant est justifié par son état de santé actuel et la date éventuelle de la reprise du travail.",
  "Préciser son aptitude médicale actuelle au poste de [poste].",
].join("\n");

function Field({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function SectionCard({ title, subtitle, children, icon }) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDisplayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

function withLineBreaks(value = "") {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function normalizeDocumentValue(value = "", fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function buildMissionItems(missionText = "") {
  const baseItems = missionText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/[;.:]+$/g, "").trim());

  return baseItems.length
    ? baseItems
    : [
        "Examiner l'interesse(e)",
        "Preciser si le repos prescrit par son medecin traitant est justifie par son etat de sante actuel et la date eventuelle de la reprise du travail",
      ];
}

function buildDocumentHtml(payload) {
  const attachmentLines = payload.attachments?.trim()
    ? payload.attachments
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const filledAttachmentLines = [...attachmentLines];

  while (filledAttachmentLines.length < 4) {
    filledAttachmentLines.push("");
  }

  const missionItems = buildMissionItems(payload.mission);
  const destinationLine = payload.destination?.trim()
    ? `<div class="line-row destination-line">
          <span class="line-label">A :</span>
          <span class="line-value">${escapeHtml(payload.destination)}</span>
        </div>`
    : "";
  const posteLine = normalizeDocumentValue(payload.poste, "................................");
  const autresMissionsLine = normalizeDocumentValue(
    payload.autresMissions,
    "................................................................."
  );
  const missionMarkup = missionItems
    .slice(0, 2)
    .map((item) => `<li>${escapeHtml(item)} ;</li>`)
    .join("");

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Demande d'Expertise Medicale</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 13mm;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          font-family: "Times New Roman", Times, serif;
          color: #000;
          background: #fff;
          font-size: 12px;
          line-height: 1.25;
        }

        .page {
          width: 210mm;
          height: 297mm;
          overflow: hidden;
          padding-top: 1mm;
          display: flex;
          flex-direction: column;
        }

        .page * {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10mm;
          margin-bottom: 7mm;
        }

        .company {
          flex: 1;
          text-align: center;
          font-weight: 700;
          font-size: 13.5px;
          line-height: 1.2;
          text-transform: uppercase;
        }

        .date-line {
          min-width: 62mm;
          text-align: right;
          white-space: nowrap;
          padding-top: 1mm;
        }

        .date-prefix {
          letter-spacing: 0.08em;
        }

        .title {
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          text-decoration: underline;
          margin: 10mm 0 12mm;
        }

        .label,
        .line-label {
          font-weight: 700;
        }

        .line-row {
          display: flex;
          align-items: flex-end;
          gap: 2mm;
          width: 100%;
          margin: 0 0 4mm;
        }

        .line-label {
          flex: 0 0 auto;
          white-space: nowrap;
        }

        .line-value {
          flex: 1 1 auto;
          min-height: 5mm;
          padding: 0 1mm 1px;
          border-bottom: 1px dotted #000;
        }

        .doctor-line {
          margin-bottom: 8mm;
        }

        .doctor-line .line-value {
          min-width: 0;
        }

        .destination-line {
          margin-bottom: 6mm;
        }

        .salutation {
          margin: 0 0 8mm;
        }

        .intro {
          margin: 0 0 7mm;
        }

        .details {
          margin: 0 0 8mm;
        }

        .section-heading {
          margin: 0 0 4mm;
          font-weight: 700;
          text-decoration: underline;
        }

        .attachments-area,
        .mission-block {
          margin-bottom: 8mm;
        }

        .writing-line {
          min-height: 7.4mm;
          width: 100%;
          padding: 0.9mm 1mm 1.1mm 0;
          border-bottom: 1px dotted #000;
        }

        .writing-line + .writing-line {
          margin-top: 2.3mm;
        }

        .writing-line span {
          display: inline-block;
          padding-left: 1mm;
        }

        .mission-list {
          margin: 0;
          padding-left: 6.5mm;
        }

        .mission-list li {
          margin: 0 0 3.5mm;
          padding-left: 0.8mm;
        }

        .mission-inline-line {
          display: inline-block;
          min-width: 54mm;
          margin-left: 1.5mm;
          padding: 0 1mm 1px;
          border-bottom: 1px dotted #000;
        }

        .mission-full-line {
          display: inline-block;
          min-width: 80mm;
          margin-left: 1.5mm;
          padding: 0 1mm 1px;
          border-bottom: 1px dotted #000;
          vertical-align: baseline;
        }

        .footer {
          margin-top: auto;
          padding-top: 2mm;
        }

        .closing {
          margin: 0 0 2mm;
          text-align: right;
        }

        .signature-block {
          margin: 0 0 4mm;
          text-align: right;
          font-weight: 700;
        }

        .note-separator {
          border: 0;
          border-top: 1px solid #000;
          margin: 5mm 0 3mm;
        }

        .note {
          margin: 0;
          font-size: 11px;
          line-height: 1.3;
        }

        @media print {
          body {
            margin: 0;
          }

          .page {
            width: 210mm;
            height: 297mm;
            overflow: hidden;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="company">${escapeHtml(payload.societe)}</div>
          <div class="date-line"><span class="date-prefix">..............</span>Le : ${escapeHtml(
            payload.dateDisplay
          )}</div>
        </div>

        <div class="title">DEMANDE D'EXPERTISE MEDICALE</div>

        <div class="line-row doctor-line">
          <span class="line-label">DR :</span>
          <span class="line-value">${escapeHtml(payload.medecin || "................")}</span>
        </div>
        ${destinationLine}
        <p class="salutation">Cher Confrere</p>
        <p class="intro">J'ai l'honneur de vous adresser pour expertise medicale :</p>

        <div class="details">
          <div class="line-row">
            <span class="line-label">Nom :</span>
            <span class="line-value">${escapeHtml(
            normalizeDocumentValue(payload.nom, "................................")
          )}</span>
          </div>
          <div class="line-row">
            <span class="line-label">Prenom :</span>
            <span class="line-value">${escapeHtml(
            normalizeDocumentValue(payload.prenom, "................................")
          )}</span>
          </div>
          <div class="line-row">
            <span class="line-label">Matricule Leoni :</span>
            <span class="line-value">${escapeHtml(
            normalizeDocumentValue(payload.matricule, "................................")
          )}</span>
          </div>
        </div>

        <div class="attachments-area">
          <p class="section-heading">Piece jointes :</p>
          ${filledAttachmentLines
            .map(
              (line) => `
          <div class="writing-line">
            <span>${escapeHtml(line)}</span>
          </div>`
            )
            .join("")}
        </div>

        <div class="mission-block">
          <p class="section-heading">Mission objet de l'expertise :</p>
          <ul class="mission-list">
            ${missionMarkup}
            <li>Preciser son aptitude medicale actuelle au poste de<span class="mission-inline-line">${escapeHtml(
              posteLine
            )}</span></li>
            <li>Autres missions :<span class="mission-full-line">${escapeHtml(
              autresMissionsLine
            )}</span></li>
          </ul>
        </div>

        <p class="honoraires">
          Afin de permettre le reglement de vos honoraires dans les meilleures conditions, nous vous prions de bien vouloir accompagner votre rapport par un memoire de reglement d'honoraires etabli en deux exemplaires selon le modele ci-joint.
        </p>

        <div class="footer">
          <p class="closing">Bien confraternellement</p>
          <div class="signature-block">Le medecin controleur de la societe Leoni</div>
          <hr class="note-separator" />
          <p class="note">NB : Priere de ne donner a la personne examinee aucune indication sur les chances de succes de sa demande.</p>
        </div>
      </div>
    </body>
  </html>`;
}

export default function DemandeExpertiseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const username = getUsername();

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [collaborateur, setCollaborateur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [files, setFiles] = useState([]);

  const [form, setForm] = useState({
    date_demande: today,
    societe: SOCIETE_PAR_DEFAUT,
    medecin_controleur: username || "",
    nom: "",
    prenom: "",
    matricule_leoni: "",
    destination_expertise: "",
    pieces_jointes: "",
    mission_objet: MISSION_PAR_DEFAUT,
    poste: "",
    autres_missions: "",
  });

  useEffect(() => {
    if (!id) {
      setCollaborateur(null);
      setLoading(false);
      return;
    }

    const fetchCollaborateur = async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get(`/collaborateurs/${id}/`);
        const data = res.data || null;
        setCollaborateur(data);
        setForm((prev) => ({
          ...prev,
          nom: data?.nom || prev.nom,
          prenom: data?.prenom || prev.prenom,
          matricule_leoni: data?.matricule || prev.matricule_leoni,
          poste: data?.poste || prev.poste,
        }));
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger les informations du collaborateur.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborateur();
  }, [id]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      medecin_controleur: username || prev.medecin_controleur,
    }));
  }, [username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildPayload = () => {
    const mission = form.mission_objet.replaceAll("[poste]", form.poste || "................");

    return {
      dateDisplay: formatDisplayDate(form.date_demande),
      societe: form.societe || SOCIETE_PAR_DEFAUT,
      medecin: form.medecin_controleur || username || "",
      nom: normalizeDocumentValue(form.nom),
      prenom: normalizeDocumentValue(form.prenom),
      matricule: normalizeDocumentValue(form.matricule_leoni),
      destination: normalizeDocumentValue(form.destination_expertise),
      attachments: normalizeDocumentValue(form.pieces_jointes),
      mission,
      poste: normalizeDocumentValue(form.poste),
      autresMissions: normalizeDocumentValue(form.autres_missions),
    };
  };

  const openDocumentWindow = ({ autoPrint }) => {
    const payload = buildPayload();
    const popup = window.open("", "_blank", "width=900,height=1200");

    if (!popup) {
      setErr("Le navigateur a bloqué l'ouverture de l'aperçu. Autorisez les popups puis réessayez.");
      return;
    }

    const html = buildDocumentHtml(payload);
    popup.document.open();
    popup.document.write(html);
    popup.document.close();

    if (autoPrint) {
      popup.onload = () => {
        popup.focus();
        popup.print();
      };
    }
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-sky-700 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-sky-50/35 to-white p-6 shadow-sm shadow-slate-200/50">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Demande d’Expertise Médicale
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Remplir le formulaire puis générer le document officiel.
        </p>
      </section>

      {err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <div className="space-y-6">
          <SectionCard
            title="Informations générales"
            subtitle="Contexte de la demande et identification du médecin contrôleur"
            icon={<FileText size={18} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  name="date_demande"
                  value={form.date_demande}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field
                label="Médecin contrôleur"
                hint="Prérempli depuis l’identifiant actuellement connecté."
              >
                <input
                  type="text"
                  name="medecin_controleur"
                  value={form.medecin_controleur}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Société">
                <input
                  type="text"
                  name="societe"
                  value={form.societe}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Collaborateur concerné"
            subtitle="Informations imprimées dans la lettre d’expertise"
            icon={<UserRound size={18} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom">
                <input
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Prénom">
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Matricule Leoni">
                <input
                  type="text"
                  name="matricule_leoni"
                  value={form.matricule_leoni}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Destination expertise">
                <input
                  type="text"
                  name="destination_expertise"
                  value={form.destination_expertise}
                  onChange={handleChange}
                  placeholder="Clinique / Médecin expert / Centre..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Pièces jointes"
            subtitle="Liste textuelle des documents joints à faire apparaître dans le PDF"
            icon={<Paperclip size={18} />}
          >
            <div className="space-y-4">
              <Field label="Liste des pièces jointes">
                <textarea
                  name="pieces_jointes"
                  rows={5}
                  value={form.pieces_jointes}
                  onChange={handleChange}
                  placeholder={"Exemple :\n- Copie de l'arrêt de travail\n- Certificat médical\n- Compte rendu de visite"}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Fichiers joints optionnels" hint="Ces fichiers ne sont pas intégrés dans le PDF, seule la liste textuelle est imprimée.">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-800 hover:file:bg-sky-200"
                />
              </Field>

              {files.length > 0 ? (
                <div className="rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600">
                  {files.map((file) => file.name).join(", ")}
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Mission objet de l’expertise"
            subtitle="Texte officiel imprimé dans la demande"
            icon={<ShieldCheck size={18} />}
          >
            <div className="space-y-4">
              <Field label="Mission objet de l’expertise">
                <textarea
                  name="mission_objet"
                  rows={7}
                  value={form.mission_objet}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Aptitude médicale actuelle au poste de">
                <input
                  type="text"
                  name="poste"
                  value={form.poste}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Autres missions"
            subtitle="À compléter uniquement si nécessaire"
            icon={<FileText size={18} />}
          >
            <Field label="Autres missions">
              <textarea
                name="autres_missions"
                rows={5}
                value={form.autres_missions}
                onChange={handleChange}
                placeholder="Ajouter des précisions complémentaires si nécessaire."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </Field>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <h2 className="text-base font-semibold text-slate-900">Aperçu du document</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Le PDF généré prend la forme d’un courrier administratif A4 sur une seule page,
              avec l’identifiant du médecin connecté repris automatiquement dans la ligne
              <span className="font-medium text-slate-700"> DR :</span>.
            </p>

            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/50 p-4 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-900">DR :</span>{" "}
                {form.medecin_controleur || username || "--"}
              </p>
              <p className="mt-2">
                <span className="font-medium text-slate-900">Collaborateur :</span>{" "}
                {`${form.prenom || ""} ${form.nom || ""}`.trim() || "--"}
              </p>
              <p className="mt-2">
                <span className="font-medium text-slate-900">Destination :</span>{" "}
                {form.destination_expertise || "--"}
              </p>
              <p className="mt-2">
                <span className="font-medium text-slate-900">Poste :</span>{" "}
                {form.poste || "--"}
              </p>
            </div>
          </section>

          {collaborateur ? (
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
              <h2 className="text-base font-semibold text-slate-900">Collaborateur chargé</h2>
              <p className="mt-2 text-sm text-slate-500">
                Les données connues ont été préremplies à partir du collaborateur sélectionné.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-900">Nom :</span> {collaborateur.nom || "--"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Prénom :</span> {collaborateur.prenom || "--"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Matricule :</span> {collaborateur.matricule || "--"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Poste :</span> {collaborateur.poste || "--"}
                </p>
              </div>
            </section>
          ) : null}

          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => openDocumentWindow({ autoPrint: false })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
              >
                <Eye size={16} />
                Aperçu avant impression
              </button>

              <button
                type="button"
                onClick={() => openDocumentWindow({ autoPrint: true })}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-sky-900/25 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Printer size={16} />
                Générer PDF
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

