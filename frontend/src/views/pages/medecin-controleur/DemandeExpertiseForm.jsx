import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRef } from "react";
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
import { getUsername } from "@/auth/auth";
import { saveDemandeExpertiseHistory } from "@/services/medecinControleurHistoryService";
import { downloadDemandeExpertisePdf } from "@/utils/generateDemandeExpertisePdf";

const SOCIETE_PAR_DEFAUT = "SOCIETE LEONI WIRING SYSTEMS TUNISIA SARL";

const MISSION_PAR_DEFAUT = [
  "Examiner l’intéressé(e).",
  "Préciser si le repos prescrit par son médecin traitant est justifié par son état de santé actuel et la date éventuelle de la reprise du travail.",
  "Préciser son aptitude médicale actuelle au poste de [poste].",
].join("\n");

function Field({ label, children, hint, error }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
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

function normalizeDocumentValue(value = "", fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

function fieldClass(error) {
  return `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
    error
      ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 focus:border-sky-400 focus:ring-sky-100"
  }`;
}

function extractCollaborateurRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function collaboratorMatchesQuery(collaborateur, query) {
  const search = String(query || "").trim().toLowerCase();
  if (!search) return false;
  const values = [
    collaborateur?.nom,
    collaborateur?.prenom,
    collaborateur?.matricule,
  ].map((value) => String(value || "").trim().toLowerCase());

  return values.some((value) => value.startsWith(search) || value.includes(search));
}

function buildDocumentHtml(payload) {
  const attachmentLines = payload.attachments?.trim()
    ? payload.attachments
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const firstAttachmentLine = attachmentLines[0] || "";
  const secondAttachmentLine = attachmentLines.slice(1).join(", ");
  const posteLine = normalizeDocumentValue(payload.poste);
  const autresMissionsLine = normalizeDocumentValue(payload.autresMissions);

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Demande d'expertise médicale</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          background: #fff;
          font-size: 11.2pt;
          line-height: 1.24;
        }

        .page {
          width: 210mm;
          height: 297mm;
          overflow: hidden;
          padding: 17mm 20mm 10mm;
          display: flex;
          flex-direction: column;
        }

        .page * {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .header {
          text-align: center;
          margin-bottom: 9mm;
        }

        .company {
          font-weight: 700;
          font-size: 11.5pt;
          text-transform: uppercase;
        }

        .date-line {
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
          gap: 2mm;
          margin-top: 9mm;
          white-space: nowrap;
        }

        .date-prefix {
          width: 19mm;
          border-bottom: 1px dotted #000;
        }

        .date-value {
          width: 34mm;
          min-height: 5mm;
          padding: 0 1mm 0.5mm;
          border-bottom: 1px dotted #000;
          text-align: left;
        }

        .title {
          text-align: center;
          font-size: 13.5pt;
          font-weight: 700;
          margin: 0 0 13mm;
        }

        .doctor-section {
          width: 74mm;
          margin: 0 0 10mm auto;
        }

        .line-row {
          display: flex;
          align-items: flex-end;
          width: 100%;
          margin-bottom: 4.5mm;
        }

        .line-label {
          flex: 0 0 auto;
          margin-right: 3mm;
          white-space: nowrap;
        }

        .dotted-line {
          flex: 1 1 auto;
          min-height: 5.2mm;
          padding: 0 1mm 0.7mm;
          border-bottom: 1px dotted #000;
        }

        .content p {
          margin: 0 0 5.5mm;
        }

        .person-fields {
          margin: 8mm 0 9mm;
          width: 136mm;
        }

        .person-fields .line-label {
          width: 35mm;
        }

        .section-heading {
          display: inline-block;
          margin: 0 0 6mm;
          font-weight: 700;
          text-decoration: underline;
        }

        .full-line {
          min-height: 6.5mm;
          padding: 0 1mm 0.7mm;
          margin-bottom: 2.5mm;
          border-bottom: 1px dotted #000;
        }

        .attachments-area {
          margin-bottom: 9mm;
        }

        .mission-block {
          margin-bottom: 8mm;
        }

        .mission-list {
          list-style: none;
          margin: 0;
          padding: 0 0 0 1mm;
        }

        .mission-list li {
          display: flex;
          gap: 3mm;
          margin: 0 0 3.5mm;
        }

        .bullet {
          flex: 0 0 auto;
          font-size: 9pt;
          line-height: 1.35;
        }

        .bullet-text {
          flex: 1 1 auto;
        }

        .inline-line {
          display: inline-block;
          min-width: 46mm;
          padding: 0 1mm 0.7mm;
          border-bottom: 1px dotted #000;
          vertical-align: baseline;
        }

        .wide-line {
          min-width: 83mm;
        }

        .honoraires {
          margin: 0;
          font-size: 10.8pt;
        }

        .closing-block {
          margin-top: auto;
          text-align: center;
        }

        .closing-block p {
          margin: 0 0 4mm;
        }

        .footer-note {
          margin-top: 11mm;
          font-size: 9pt;
        }

        .empty-line {
          color: transparent;
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
          <div class="date-line">
            <span class="date-prefix"></span>
            <span>Le :</span>
            <span class="date-value">${escapeHtml(payload.dateDisplay || "")}</span>
          </div>
        </div>

        <div class="title">DEMANDE D'EXPERTISE MEDICALE</div>

        <div class="doctor-section">
          <div class="line-row">
            <span class="line-label">DR :</span>
            <span class="dotted-line">${escapeHtml(payload.medecin || "")}</span>
          </div>
          <div class="line-row">
            <span class="dotted-line">${escapeHtml(payload.destination || "")}</span>
          </div>
        </div>

        <div class="content">
          <p>Cher Confrère</p>
          <p>J'ai l'honneur de vous adresser pour expertise médicale :</p>
        </div>

        <div class="person-fields">
          <div class="line-row">
            <span class="line-label">Nom :</span>
            <span class="dotted-line">${escapeHtml(normalizeDocumentValue(payload.nom))}</span>
          </div>
          <div class="line-row">
            <span class="line-label">Prénom :</span>
            <span class="dotted-line">${escapeHtml(normalizeDocumentValue(payload.prenom))}</span>
          </div>
          <div class="line-row">
            <span class="line-label">Matricule Leoni :</span>
            <span class="dotted-line">${escapeHtml(normalizeDocumentValue(payload.matricule))}</span>
          </div>
        </div>

        <div class="attachments-area">
          <p class="section-heading">Pièce jointes :</p>
          <div class="full-line">${escapeHtml(firstAttachmentLine)}</div>
          <div class="full-line">${escapeHtml(secondAttachmentLine)}</div>
        </div>

        <div class="mission-block">
          <p class="section-heading">Mission objet de l'expertise :</p>
          <ul class="mission-list">
            <li><span class="bullet">▪</span><span class="bullet-text">Examiner L'intéressé (e) ;</span></li>
            <li><span class="bullet">▪</span><span class="bullet-text">Préciser si le repos prescrit par son médecin traitant est justifié par son état de santé actuel et la date éventuelle de la reprise du travail.</span></li>
            <li><span class="bullet">▪</span><span class="bullet-text">Préciser son aptitude médicale actuelle au poste de <span class="inline-line">${escapeHtml(posteLine)}</span></span></li>
            <li><span class="bullet">▪</span><span class="bullet-text">Autres missions : <span class="inline-line wide-line">${escapeHtml(autresMissionsLine)}</span></span></li>
          </ul>
        </div>

        <p class="honoraires">
          Afin de permettre le règlement de vos honoraires dans les meilleures conditions, nous vous prions de bien vouloir accompagner votre rapport par un mémoire de règlement d'honoraires établi en deux exemplaires selon le modèle ci-joint.
        </p>

        <div class="closing-block">
          <p>Bien confraternellement</p>
          <p>Le médecin contrôleur de la société Leoni</p>
        </div>

        <div class="footer-note">
          NB : Prière de ne donner à la personne examinée aucune indication sur les chances de succès de sa demande.
        </div>
      </div>
    </body>
  </html>`;
}

export default function DemandeExpertiseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const username = getUsername();
  const autocompleteRef = useRef(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [collaborateur, setCollaborateur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [allCollaborateurs, setAllCollaborateurs] = useState([]);
  const [collaborateurResults, setCollaborateurResults] = useState([]);
  const [collaborateurSearchLoading, setCollaborateurSearchLoading] = useState(false);
  const [showCollaborateurDropdown, setShowCollaborateurDropdown] = useState(false);
  const [selectedCollaborateurId, setSelectedCollaborateurId] = useState("");
  const [collaborateurSearchText, setCollaborateurSearchText] = useState("");

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
        setSelectedCollaborateurId(String(data?.id || ""));
        setCollaborateurSearchText(data?.nom || "");
        setValidationErrors((prev) => {
          if (!prev.collaborateur) return prev;
          const next = { ...prev };
          delete next.collaborateur;
          return next;
        });
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

  useEffect(() => {
    let cancelled = false;

    const loadCollaborateurs = async () => {
      try {
        const response = await api.get("/collaborateurs/");
        if (!cancelled) setAllCollaborateurs(extractCollaborateurRows(response.data));
      } catch (error) {
        console.error("Erreur chargement collaborateurs demande expertise", error);
        if (!cancelled) setAllCollaborateurs([]);
      }
    };

    loadCollaborateurs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!autocompleteRef.current?.contains(event.target)) {
        setShowCollaborateurDropdown(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const query = collaborateurSearchText.trim();
    if (query.length < 1 || selectedCollaborateurId) {
      setCollaborateurResults([]);
      setCollaborateurSearchLoading(false);
      setShowCollaborateurDropdown(false);
      return;
    }

    const localResults = allCollaborateurs
      .filter((item) => collaboratorMatchesQuery(item, query))
      .slice(0, 8);

    setCollaborateurResults(localResults);
    setCollaborateurSearchLoading(true);
    setShowCollaborateurDropdown(true);

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await api.get("/collaborateurs/", {
          params: { search: query },
        });
        if (cancelled) return;
        const remoteRows = extractCollaborateurRows(response.data).filter((item) =>
          collaboratorMatchesQuery(item, query)
        );
        const rowsByKey = new Map();
        [...localResults, ...remoteRows].forEach((item) => {
          const key = item.id || item.matricule || `${item.nom}-${item.prenom}`;
          if (key) rowsByKey.set(String(key), item);
        });
        const rows = Array.from(rowsByKey.values()).slice(0, 8);
        setCollaborateurResults(rows);
        setShowCollaborateurDropdown(true);
      } catch (error) {
        console.error("Erreur recherche collaborateurs demande expertise", error);
        if (!cancelled) setCollaborateurResults(localResults);
      } finally {
        if (!cancelled) setCollaborateurSearchLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [allCollaborateurs, collaborateurSearchText, selectedCollaborateurId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === "nom") {
      setCollaborateur(null);
      setSelectedCollaborateurId("");
      setCollaborateurSearchText(value);
      setShowCollaborateurDropdown(hasValue(value));
    }
    if (hasValue(value)) {
      setValidationErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSelectCollaborateur = (item) => {
    setCollaborateur(item);
    setSelectedCollaborateurId(String(item.id || ""));
    setCollaborateurSearchText(item.nom || "");
    setShowCollaborateurDropdown(false);
    setCollaborateurResults([]);
    setForm((prev) => ({
      ...prev,
      nom: item.nom || "",
      prenom: item.prenom || "",
      matricule_leoni: item.matricule || "",
      poste: item.poste || prev.poste,
    }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.collaborateur;
      delete next.nom;
      delete next.prenom;
      delete next.matricule_leoni;
      if (item.poste) delete next.poste;
      return next;
    });
  };

  const validateBeforePdf = () => {
    const nextErrors = {};

    if (!hasValue(form.date_demande)) nextErrors.date_demande = "Veuillez renseigner la date.";
    if (!hasValue(form.medecin_controleur)) {
      nextErrors.medecin_controleur = "Veuillez renseigner le médecin contrôleur.";
    }
    if (!hasValue(form.societe)) nextErrors.societe = "Veuillez renseigner la société.";
    if (!hasValue(form.nom)) nextErrors.nom = "Veuillez renseigner le nom.";
    if (!hasValue(form.prenom)) nextErrors.prenom = "Veuillez renseigner le prénom.";
    if (!hasValue(form.matricule_leoni)) nextErrors.matricule_leoni = "Veuillez renseigner le matricule.";
    if (!hasValue(form.destination_expertise)) {
      nextErrors.destination_expertise = "Veuillez renseigner le médecin ou destinataire de l'expertise.";
    }
    if (!hasValue(form.mission_objet)) nextErrors.mission_objet = "Veuillez renseigner le motif.";
    if (!hasValue(form.poste)) nextErrors.poste = "Veuillez renseigner le poste.";

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => {
    const mission = form.mission_objet.replaceAll("[poste]", form.poste || "____________________");

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

  const openDocumentWindow = () => {
    if (!validateBeforePdf()) {
      setErr("Veuillez compléter les champs obligatoires avant de générer le PDF.");
      return;
    }

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

    popup.focus();
  };

  const handleGeneratePdf = async () => {
    if (!validateBeforePdf()) {
      setErr("Veuillez compléter les champs obligatoires avant de générer le PDF.");
      return;
    }

    const payload = buildPayload();

    try {
      setErr("");
      const pdfData = {
        date: form.date_demande,
        societe: payload.societe,
        medecinControleur: payload.medecin,
        nom: payload.nom,
        prenom: payload.prenom,
        matriculeLeoni: payload.matricule,
        destination: payload.destination,
        piecesJointes: payload.attachments,
        mission: payload.mission,
        aptitudePoste: payload.poste,
        autresMissions: payload.autresMissions,
      };
      const pdfFilename = await downloadDemandeExpertisePdf(pdfData);

      await saveDemandeExpertiseHistory({
        date: pdfData.date,
        destinataire: pdfData.destination,
        nom: pdfData.nom,
        prenom: pdfData.prenom,
        matricule_leoni: pdfData.matriculeLeoni,
        pieces_jointes: pdfData.piecesJointes,
        attachment_names: files.map((file) => file.name),
        aptitude_poste: pdfData.aptitudePoste,
        autres_missions: pdfData.autresMissions,
        medecin_identifiant: pdfData.medecinControleur,
        pdf_filename: pdfFilename,
        statut: "VALIDE",
      });
    } catch (error) {
      console.error("Erreur generation demande expertise PDF", error);
      setErr("Impossible de générer le PDF de la demande d'expertise ou d'enregistrer l'historique.");
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
              <Field label="Date" error={validationErrors.date_demande}>
                <input
                  type="date"
                  name="date_demande"
                  value={form.date_demande}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.date_demande)}
                />
              </Field>

              <Field
                label="Médecin contrôleur"
                hint="Prérempli depuis l’identifiant actuellement connecté."
                error={validationErrors.medecin_controleur}
              >
                <input
                  type="text"
                  name="medecin_controleur"
                  value={form.medecin_controleur}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.medecin_controleur)}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Société" error={validationErrors.societe}>
                <input
                  type="text"
                  name="societe"
                  value={form.societe}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.societe)}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Collaborateur concerné"
            subtitle="Informations imprimées dans la lettre d’expertise"
            icon={<UserRound size={18} />}
          >
            {validationErrors.collaborateur ? (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {validationErrors.collaborateur}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom" error={validationErrors.nom}>
                <div ref={autocompleteRef} className="relative z-[100]">
                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    onFocus={() => {
                      if (hasValue(form.nom) && !selectedCollaborateurId) {
                        setCollaborateurSearchText(form.nom);
                        setShowCollaborateurDropdown(true);
                      }
                    }}
                    autoComplete="off"
                    className={fieldClass(validationErrors.nom)}
                  />
                  {showCollaborateurDropdown && hasValue(form.nom) && !selectedCollaborateurId ? (
                    <div className="absolute left-0 right-0 z-[99999] mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-200/70">
                      {collaborateurResults.length > 0 ? (
                        collaborateurResults.map((item) => (
                          <button
                            key={item.id || item.matricule || `${item.nom}-${item.prenom}`}
                            type="button"
                            onClick={() => handleSelectCollaborateur(item)}
                            className="w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sky-50"
                          >
                            <span className="block font-medium text-slate-900">
                              {item.nom || "--"} {item.prenom || "--"}
                            </span>
                            <span className="block text-xs text-slate-500">
                              Matricule LEONI: {item.matricule || "N/A"}
                            </span>
                          </button>
                        ))
                      ) : collaborateurSearchLoading ? (
                        <div className="px-3 py-2 text-sm text-slate-500">Recherche en cours...</div>
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500">Aucun collaborateur trouvé</div>
                      )}
                      {collaborateurSearchLoading && collaborateurResults.length > 0 ? (
                        <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
                          Recherche en cours...
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Field>

              <Field label="Prénom" error={validationErrors.prenom}>
                <input
                  type="text"
                  name="prenom"
                  value={form.prenom}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.prenom)}
                />
              </Field>

              <Field label="Matricule Leoni" error={validationErrors.matricule_leoni}>
                <input
                  type="text"
                  name="matricule_leoni"
                  value={form.matricule_leoni}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.matricule_leoni)}
                />
              </Field>

              <Field label="Destination expertise" error={validationErrors.destination_expertise}>
                <input
                  type="text"
                  name="destination_expertise"
                  value={form.destination_expertise}
                  onChange={handleChange}
                  placeholder="Clinique / Médecin expert / Centre..."
                  className={fieldClass(validationErrors.destination_expertise)}
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
              <Field label="Mission objet de l’expertise" error={validationErrors.mission_objet}>
                <textarea
                  name="mission_objet"
                  rows={7}
                  value={form.mission_objet}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.mission_objet)}
                />
              </Field>

              <Field label="Aptitude médicale actuelle au poste de" error={validationErrors.poste}>
                <input
                  type="text"
                  name="poste"
                  value={form.poste}
                  onChange={handleChange}
                  className={fieldClass(validationErrors.poste)}
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
                onClick={openDocumentWindow}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 transition hover:bg-sky-100"
              >
                <Eye size={16} />
                Aperçu avant impression
              </button>

              <button
                type="button"
                onClick={handleGeneratePdf}
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




