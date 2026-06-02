import { useMemo, useState } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getUsername } from "../../auth/auth";
import { downloadDemandeExpertisePdf } from "../../utils/generateDemandeExpertisePdf";
import { saveDemandeExpertiseHistory } from "../../services/medecinControleurHistoryService";

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

export default function DemandeExpertisePdfPage() {
  const navigate = useNavigate();
  const sessionDoctorName = getUsername();
  const fallbackDoctorName = "Dr. ____________";
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [form, setForm] = useState({
    ville: "",
    date: today,
    destinataire: "",
    nom: "",
    prenom: "",
    matriculeLeoni: "",
    piecesJointes: "",
    aptitudePoste: "",
    autresMissions: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const doctorDisplay = sessionDoctorName || fallbackDoctorName;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilesChange = (event) => {
    setSelectedFiles(Array.from(event.target.files || []));
  };

  const handleGeneratePdf = async () => {
    try {
      setIsSaving(true);

      const pdfData = {
        ...form,
        medecinControleur: doctorDisplay,
        attachmentNames: selectedFiles.map((file) => file.name),
      };
      const pdfFilename = await downloadDemandeExpertisePdf(pdfData);

      try {
        await saveDemandeExpertiseHistory({
          ville: pdfData.ville,
          date: pdfData.date,
          destinataire: pdfData.destinataire,
          nom: pdfData.nom,
          prenom: pdfData.prenom,
          matricule_leoni: pdfData.matriculeLeoni,
          pieces_jointes: pdfData.piecesJointes,
          attachment_names: pdfData.attachmentNames,
          aptitude_poste: pdfData.aptitudePoste,
          autres_missions: pdfData.autresMissions,
          medecin_identifiant: pdfData.medecinControleur,
          pdf_filename: pdfFilename,
          statut: "VALIDE",
        });
      } catch (saveError) {
        console.error("Erreur sauvegarde historique demande expertise", saveError);
        window.alert("PDF genere, mais impossible d'enregistrer la demande dans l'historique.");
      }
    } catch (error) {
      console.error("Erreur generation demande expertise PDF", error);
      window.alert("Impossible de generer le PDF de la demande d'expertise.");
    } finally {
      setIsSaving(false);
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
          Demande d&apos;Expertise Médicale
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Remplissez le formulaire puis téléchargez directement la lettre officielle en PDF.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <div className="space-y-6">
          <SectionCard
            title="Informations de courrier"
            subtitle="Renseignements affichés dans l’en-tête du document"
            icon={<FileText size={18} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ville / Lieu">
                <input
                  type="text"
                  name="ville"
                  value={form.ville}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Date">
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field
                label="Médecin contrôleur"
                hint="Identifiant repris automatiquement depuis la session connectée."
              >
                <input
                  type="text"
                  value={doctorDisplay}
                  readOnly
                  className="w-full rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-700 outline-none"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field
                label="DR (Destinataire)"
                hint="Saisissez une ou deux lignes selon le document de destination."
              >
                <textarea
                  name="destinataire"
                  rows={2}
                  value={form.destinataire}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Collaborateur concerné"
            subtitle="Informations du salarié à afficher dans le courrier"
            icon={<FileText size={18} />}
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
                  name="matriculeLeoni"
                  value={form.matriculeLeoni}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Missions et pièces jointes"
            subtitle="Contenu reproduit dans le PDF généré"
            icon={<FileText size={18} />}
          >
            <div className="space-y-4">
              <Field
                label="Pièces jointes"
                hint="Choisissez un ou plusieurs fichiers. Les noms sélectionnés seront repris dans le PDF."
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFilesChange}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-800 hover:file:bg-sky-200"
                />
                {selectedFiles.length > 0 ? (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-600">
                    {selectedFiles.map((file) => file.name).join(", ")}
                  </div>
                ) : null}
                <textarea
                  name="piecesJointes"
                  rows={2}
                  value={form.piecesJointes}
                  onChange={handleChange}
                  placeholder="Note optionnelle sur les pièces jointes"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Aptitude au poste">
                <input
                  type="text"
                  name="aptitudePoste"
                  value={form.aptitudePoste}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>

              <Field label="Autres missions">
                <textarea
                  name="autresMissions"
                  rows={3}
                  value={form.autresMissions}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </Field>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <h2 className="text-base font-semibold text-slate-900">Signature automatique</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Le nom du médecin contrôleur est repris automatiquement depuis la session active et
              ajouté en bas du PDF.
            </p>
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/50 px-4 py-3 text-sm text-slate-700">
              {doctorDisplay}
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-sky-900/25 transition hover:bg-slate-800"
            >
              <Download size={16} />
              {isSaving ? "Enregistrement..." : "Générer le PDF"}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
