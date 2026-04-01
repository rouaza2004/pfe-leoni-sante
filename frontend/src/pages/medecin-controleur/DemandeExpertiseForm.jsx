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
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
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

function buildDocumentHtml(payload) {
  const attachmentsText = payload.attachments?.trim()
    ? withLineBreaks(payload.attachments)
    : "Aucune pièce jointe renseignée.";
  const autresMissions = payload.autresMissions?.trim()
    ? withLineBreaks(payload.autresMissions)
    : "Néant.";

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Demande d'Expertise Médicale</title>
      <style>
        @page {
          size: A4;
          margin: 12mm 14mm 12mm 14mm;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          font-family: "Times New Roman", Times, serif;
          color: #111827;
          background: #ffffff;
          line-height: 1.36;
          font-size: 12px;
        }

        .page {
          width: 210mm;
          height: 297mm;
          max-height: 297mm;
          overflow: hidden;
          position: relative;
          page-break-inside: avoid;
          break-inside: avoid;
          padding: 0 1mm;
        }

        .page * {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .top-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 2mm;
          margin-bottom: 7mm;
        }

        .company {
          text-align: center;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.02em;
          margin-bottom: 4mm;
        }

        .title {
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          text-decoration: underline;
          margin: 8mm 0 7mm;
        }

        .paragraph {
          margin: 0 0 3.6mm;
        }

        .label {
          font-weight: 700;
        }

        .doctor-line {
          margin-bottom: 5mm;
        }

        .salutation {
          margin-bottom: 5mm;
        }

        .intro {
          margin-bottom: 5mm;
        }

        .details {
          margin: 0 0 6mm;
        }

        .details p {
          margin: 0 0 2.1mm;
        }

        .attachments-title,
        .mission-title {
          margin-bottom: 2.4mm;
        }

        .attachments-box {
          border: 1px solid #111827;
          min-height: 22mm;
          padding: 3mm 3.5mm;
          margin-bottom: 5.5mm;
        }

        .attachments-box p {
          margin: 0;
        }

        .mission-block {
          margin-bottom: 5mm;
        }

        .mission-text {
          margin: 0;
          white-space: normal;
        }

        .autres-missions {
          margin-bottom: 5mm;
        }

        .honoraires {
          margin-bottom: 5mm;
        }

        .closing {
          margin-bottom: 18mm;
        }

        .signature-block {
          text-align: right;
          font-weight: 700;
          margin-top: 0;
        }

        .bottom-area {
          position: absolute;
          right: 1mm;
          left: 1mm;
          bottom: 4mm;
        }

        .separator {
          margin: 18mm 0 4mm;
          border: 0;
          border-top: 1px solid #111827;
        }

        .note {
          margin-top: 0;
          font-style: italic;
          font-size: 11.2px;
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
        <div class="company">${escapeHtml(payload.societe)}</div>
        <div class="top-row">Le : ${escapeHtml(payload.dateDisplay)}</div>

        <div class="title">DEMANDE D’EXPERTISE MEDICALE</div>

        <p class="paragraph doctor-line"><span class="label">DR :</span> ${escapeHtml(payload.medecin)}</p>
        <p class="paragraph salutation">Cher Confrère,</p>
        <p class="paragraph intro">J’ai l’honneur de vous adresser pour expertise médicale :</p>

        <div class="details">
          <p><span class="label">Nom :</span> ${escapeHtml(payload.nom)}</p>
          <p><span class="label">Prénom :</span> ${escapeHtml(payload.prenom)}</p>
          <p><span class="label">Matricule Leoni :</span> ${escapeHtml(payload.matricule)}</p>
          <p><span class="label">Destination expertise :</span> ${escapeHtml(
            payload.destination
          )}</p>
        </div>

        <p class="paragraph attachments-title"><span class="label">Pièces jointes :</span></p>
        <div class="attachments-box">
          <p>${attachmentsText}</p>
        </div>

        <div class="mission-block">
          <p class="paragraph mission-title"><span class="label">Mission objet de l’expertise :</span></p>
          <p class="paragraph mission-text">${withLineBreaks(payload.mission)}</p>
        </div>

        <p class="paragraph autres-missions"><span class="label">Autres missions :</span> ${autresMissions}</p>

        <p class="paragraph honoraires">Les honoraires et les frais de l'expertise seront directement réglés par la société.</p>
        <p class="paragraph closing">Bien confraternellement,</p>

        <div class="bottom-area">
          <div class="signature-block">Le médecin contrôleur de la société Leoni</div>
          <hr class="separator" />
          <p class="note">NB : Prière de ne donner à la personne examinée aucune indication sur les chances de succès de sa demande.</p>
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
      nom: form.nom || "",
      prenom: form.prenom || "",
      matricule: form.matricule_leoni || "",
      destination: form.destination_expertise || "",
      attachments: form.pieces_jointes || "",
      mission,
      autresMissions: form.autres_missions || "",
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
        className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Demande d’Expertise Médicale
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Remplir le formulaire puis générer le document officiel.
        </p>
      </section>

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </Field>

              <Field label="Prénom">
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </Field>

              <Field label="Matricule Leoni">
                <input
                  type="text"
                  name="matricule_leoni"
                  value={form.matricule_leoni}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </Field>

              <Field label="Destination expertise">
                <input
                  type="text"
                  name="destination_expertise"
                  value={form.destination_expertise}
                  onChange={handleChange}
                  placeholder="Clinique / Médecin expert / Centre..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </Field>

              <Field label="Fichiers joints optionnels" hint="Ces fichiers ne sont pas intégrés dans le PDF, seule la liste textuelle est imprimée.">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                />
              </Field>

              {files.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </Field>

              <Field label="Aptitude médicale actuelle au poste de">
                <input
                  type="text"
                  name="poste"
                  value={form.poste}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </Field>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
            <h2 className="text-base font-semibold text-slate-900">Aperçu du document</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Le PDF généré prend la forme d’un courrier administratif A4 sur deux pages,
              avec l’identifiant du médecin connecté repris automatiquement dans la ligne
              <span className="font-medium text-slate-700"> DR :</span>.
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
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
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
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

          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => openDocumentWindow({ autoPrint: false })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-200"
              >
                <Eye size={16} />
                Aperçu avant impression
              </button>

              <button
                type="button"
                onClick={() => openDocumentWindow({ autoPrint: true })}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
