import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, Plus, Trash2 } from "lucide-react";
import { api } from "@/api/api";
import { fixFrenchTextDeep } from "@/utils/fixFrenchText";

const controlBaseClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 text-sm leading-6 tracking-normal text-slate-900 [font-kerning:normal] [font-variant-ligatures:none] [text-rendering:optimizeLegibility] antialiased outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600 disabled:opacity-100";

const Input = ({ label, className = "", ...props }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {label}
    </label>
    <input
      {...props}
      className={`${controlBaseClassName} h-12 appearance-none py-2.5 align-middle focus:ring-2 focus:ring-slate-200 ${className}`.trim()}
    />
  </div>
);

const TextArea = ({ label, rows = 4, className = "", ...props }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {label}
    </label>
    <textarea
      {...props}
      rows={rows}
      className={`${controlBaseClassName} min-h-12 resize-y py-2.5 focus:ring-2 focus:ring-slate-200 ${className}`.trim()}
    />
  </div>
);

const Select = ({ label, children, className = "", ...props }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {label}
    </label>
    <select
      {...props}
      className={`${controlBaseClassName} h-12 appearance-none py-2.5 focus:ring-2 focus:ring-slate-200 ${className}`.trim()}
    >
      {children}
    </select>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <h2 className="text-lg font-semibold text-slate-900 mb-5">{title}</h2>
    {children}
  </div>
);

const emptyVaccin = () => ({
  id: null,
  vaccin: "",
  date_1: "",
  date_2: "",
  date_3: "",
  date_rappel: "",
});

const emptyPoste = () => ({
  id: null,
  date_debut: "",
  date_fin: "",
  description: "",
  risque_professionnel: "",
});

const emptyExamenUlterieur = () => ({
  id: null,
  type_examen: "PERIODIQUE",
  date: "",
  medecin_nom: "",
  poste_travail: "",
  poids: "",
  taille: "",
  conclusion: "",
});

export default function DossierMedicalCompletForm({
  collaborateurId: propId,
  readOnly = false,
  backPath = null,
  embedded = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const collaborateurId = Number(propId ?? id);
  const isReadOnly = readOnly;

  const [collab, setCollab] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [examenInitialId, setExamenInitialId] = useState(null);

  const [vaccinations, setVaccinations] = useState([emptyVaccin()]);
  const [postes, setPostes] = useState([emptyPoste()]);
  const [examensUlterieurs, setExamensUlterieurs] = useState([emptyExamenUlterieur()]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillMsg, setAutofillMsg] = useState("");

  const [form, setForm] = useState({
    cin: "",
    date_naissance: "",
    telephone: "",
    adresse: "",
    poste: "",
    departement: "",

    entreprise: "",
    localite: "",
    date_recrutement: "",
    niveau_etudes_diplomes: "",
    profession: "",
    poste_travail_actuel: "",

    antecedents_medicaux: "",
    antecedents_chirurgicaux: "",
    antecedents_gynecologiques: "",
    antecedents_heredofamiliaux: "",

    tabac: "",
    alcool: "",
    automedication: "",

    medecin_nom: "",
    date_examen: "",
    poids: "",
    taille: "",
    tension_arterielle: "",
    pouls: "",
    vision_od_pres: "",
    vision_od_loin: "",
    vision_og_pres: "",
    vision_og_loin: "",
    audition_od: "",
    audition_og: "",
    denture: "",
    teguments: "",
    appareil_locomoteur: "",
    appareil_respiratoire: "",
    appareil_cardio_vasculaire: "",
    abdomen: "",
    appareil_genito_urinaire: "",
    glandes_endocrines: "",
    systeme_nerveux: "",
    examens_complementaires: "",
    resultat_examen: "",
    aptitude: "",
    precision_aptitude: "",
    conclusion: "",
  });

  const reload = async () => {

      try {
        setLoading(true);
        setErr("");

        const [collabRes, dossierRes] = await Promise.all([
          api.get(`/collaborateurs/${collaborateurId}/`),
          api.get(`/medical/dossier/${collaborateurId}/`),
        ]);

        const collabData = fixFrenchTextDeep(collabRes.data || {});
        const dossierData = fixFrenchTextDeep(dossierRes.data || {});
        const examen = dossierData?.examen_initial || null;

        setCollab(collabData);
        setDossier(dossierData);
        setExamenInitialId(examen?.id || null);

        setVaccinations(
          dossierData?.vaccinations?.length
            ? dossierData.vaccinations.map((v) => ({
                id: v.id || null,
                vaccin: v.vaccin || "",
                date_1: v.date_1 || "",
                date_2: v.date_2 || "",
                date_3: v.date_3 || "",
                date_rappel: v.date_rappel || "",
              }))
            : [emptyVaccin()]
        );

        setPostes(
          dossierData?.postes?.length
            ? dossierData.postes.map((p) => ({
                id: p.id || null,
                date_debut: p.date_debut || "",
                date_fin: p.date_fin || "",
                description: p.description || "",
                risque_professionnel: p.risque_professionnel || "",
              }))
            : [emptyPoste()]
        );

        setExamensUlterieurs(
          dossierData?.examens_ulterieurs?.length
            ? dossierData.examens_ulterieurs.map((e) => ({
                id: e.id || null,
                type_examen: e.type_examen || "PERIODIQUE",
                date: e.date || "",
                medecin_nom: e.medecin_nom || "",
                poste_travail: e.poste_travail || "",
                poids: e.poids ?? "",
                taille: e.taille ?? "",
                conclusion: e.conclusion || "",
              }))
            : [emptyExamenUlterieur()]
        );

        setForm({
          cin: collabData.cin || "",
          date_naissance: collabData.date_naissance || "",
          telephone: collabData.telephone || "",
          adresse: collabData.adresse || "",
          poste: collabData.poste || "",
          departement: collabData.departement || "",

          entreprise: dossierData.entreprise || "",
          localite: dossierData.localite || "",
          date_recrutement: dossierData.date_recrutement || "",
          niveau_etudes_diplomes: dossierData.niveau_etudes_diplomes || "",
          profession: dossierData.profession || "",
          poste_travail_actuel: dossierData.poste_travail_actuel || "",

          antecedents_medicaux: dossierData.antecedents_medicaux || "",
          antecedents_chirurgicaux: dossierData.antecedents_chirurgicaux || "",
          antecedents_gynecologiques: dossierData.antecedents_gynecologiques || "",
          antecedents_heredofamiliaux: dossierData.antecedents_heredofamiliaux || "",

          tabac: dossierData.tabac || "",
          alcool: dossierData.alcool || "",
          automedication: dossierData.automedication || "",

          medecin_nom: examen?.medecin_nom || "",
          date_examen: examen?.date_examen || new Date().toISOString().slice(0, 10),
          poids: examen?.poids ?? "",
          taille: examen?.taille ?? "",
          tension_arterielle: examen?.tension_arterielle || "",
          pouls: examen?.pouls || "",
          vision_od_pres: examen?.vision_od_pres || "",
          vision_od_loin: examen?.vision_od_loin || "",
          vision_og_pres: examen?.vision_og_pres || "",
          vision_og_loin: examen?.vision_og_loin || "",
          audition_od: examen?.audition_od || "",
          audition_og: examen?.audition_og || "",
          denture: examen?.denture || "",
          teguments: examen?.teguments || "",
          appareil_locomoteur: examen?.appareil_locomoteur || "",
          appareil_respiratoire: examen?.appareil_respiratoire || "",
          appareil_cardio_vasculaire: examen?.appareil_cardio_vasculaire || "",
          abdomen: examen?.abdomen || "",
          appareil_genito_urinaire: examen?.appareil_genito_urinaire || "",
          glandes_endocrines: examen?.glandes_endocrines || "",
          systeme_nerveux: examen?.systeme_nerveux || "",
          examens_complementaires: examen?.examens_complementaires || "",
          resultat_examen: examen?.resultat_examen || "",
          aptitude: examen?.aptitude || "",
          precision_aptitude: examen?.precision_aptitude || "",
          conclusion: examen?.conclusion || "",
        });
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger le dossier médical complet.");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const [collabRes, dossierRes] = await Promise.all([
          api.get(`/collaborateurs/${collaborateurId}/`),
          api.get(`/medical/dossier/${collaborateurId}/`),
        ]);

        if (cancelled) return;

        const collabData = fixFrenchTextDeep(collabRes.data || {});
        const dossierData = fixFrenchTextDeep(dossierRes.data || {});
        const examen = dossierData?.examen_initial || null;

        setCollab(collabData);
        setDossier(dossierData);
        setExamenInitialId(examen?.id || null);

        setVaccinations(
          dossierData?.vaccinations?.length
            ? dossierData.vaccinations.map((v) => ({
                id: v.id || null,
                vaccin: v.vaccin || "",
                date_1: v.date_1 || "",
                date_2: v.date_2 || "",
                date_3: v.date_3 || "",
                date_rappel: v.date_rappel || "",
              }))
            : [emptyVaccin()]
        );

        setPostes(
          dossierData?.postes?.length
            ? dossierData.postes.map((p) => ({
                id: p.id || null,
                date_debut: p.date_debut || "",
                date_fin: p.date_fin || "",
                description: p.description || "",
                risque_professionnel: p.risque_professionnel || "",
              }))
            : [emptyPoste()]
        );

        setExamensUlterieurs(
          dossierData?.examens_ulterieurs?.length
            ? dossierData.examens_ulterieurs.map((e) => ({
                id: e.id || null,
                type_examen: e.type_examen || "PERIODIQUE",
                date: e.date || "",
                medecin_nom: e.medecin_nom || "",
                poste_travail: e.poste_travail || "",
                poids: e.poids ?? "",
                taille: e.taille ?? "",
                conclusion: e.conclusion || "",
              }))
            : [emptyExamenUlterieur()]
        );

        setForm({
          cin: collabData.cin || "",
          date_naissance: collabData.date_naissance || "",
          telephone: collabData.telephone || "",
          adresse: collabData.adresse || "",
          poste: collabData.poste || "",
          departement: collabData.departement || "",

          entreprise: dossierData.entreprise || "",
          localite: dossierData.localite || "",
          date_recrutement: dossierData.date_recrutement || "",
          niveau_etudes_diplomes: dossierData.niveau_etudes_diplomes || "",
          profession: dossierData.profession || "",
          poste_travail_actuel: dossierData.poste_travail_actuel || "",

          antecedents_medicaux: dossierData.antecedents_medicaux || "",
          antecedents_chirurgicaux: dossierData.antecedents_chirurgicaux || "",
          antecedents_gynecologiques: dossierData.antecedents_gynecologiques || "",
          antecedents_heredofamiliaux: dossierData.antecedents_heredofamiliaux || "",

          tabac: dossierData.tabac || "",
          alcool: dossierData.alcool || "",
          automedication: dossierData.automedication || "",

          medecin_nom: examen?.medecin_nom || "",
          date_examen: examen?.date_examen || new Date().toISOString().slice(0, 10),
          poids: examen?.poids ?? "",
          taille: examen?.taille ?? "",
          tension_arterielle: examen?.tension_arterielle || "",
          pouls: examen?.pouls || "",
          vision_od_pres: examen?.vision_od_pres || "",
          vision_od_loin: examen?.vision_od_loin || "",
          vision_og_pres: examen?.vision_og_pres || "",
          vision_og_loin: examen?.vision_og_loin || "",
          audition_od: examen?.audition_od || "",
          audition_og: examen?.audition_og || "",
          denture: examen?.denture || "",
          teguments: examen?.teguments || "",
          appareil_locomoteur: examen?.appareil_locomoteur || "",
          appareil_respiratoire: examen?.appareil_respiratoire || "",
          appareil_cardio_vasculaire: examen?.appareil_cardio_vasculaire || "",
          abdomen: examen?.abdomen || "",
          appareil_genito_urinaire: examen?.appareil_genito_urinaire || "",
          glandes_endocrines: examen?.glandes_endocrines || "",
          systeme_nerveux: examen?.systeme_nerveux || "",
          examens_complementaires: examen?.examens_complementaires || "",
          resultat_examen: examen?.resultat_examen || "",
          aptitude: examen?.aptitude || "",
          precision_aptitude: examen?.precision_aptitude || "",
          conclusion: examen?.conclusion || "",
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr("Impossible de charger le dossier médical complet.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [collaborateurId]);

  const fullName = useMemo(() => {
    if (!collab) return "";
    return `${collab.nom || ""} ${collab.prenom || ""}`.trim();
  }, [collab]);

  const containerClass = embedded ? "space-y-6" : "p-6 space-y-6";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (setter, index, field, value) => {
    setter((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addVaccination = () => setVaccinations((prev) => [...prev, emptyVaccin()]);
  const addPoste = () => setPostes((prev) => [...prev, emptyPoste()]);
  const addExamenUlterieur = () =>
    setExamensUlterieurs((prev) => [...prev, emptyExamenUlterieur()]);

  const removeVaccination = (index) =>
    setVaccinations((prev) => prev.filter((_, i) => i !== index));
  const removePoste = (index) =>
    setPostes((prev) => prev.filter((_, i) => i !== index));
  const removeExamenUlterieur = (index) =>
    setExamensUlterieurs((prev) => prev.filter((_, i) => i !== index));

  const handleAutofill = async () => {
    if (isReadOnly) return;

    try {
      setAutofillMsg("");
      setAutofillLoading(true);
      await api.post(`/medical/dossier/${collaborateurId}/autofill/`);
      setAutofillMsg("Auto-remplissage terminé.");
      await reload();
    } catch (e) {
      console.error(e);
      setAutofillMsg("Erreur lors de l'auto-remplissage.");
    } finally {
      setAutofillLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!dossier?.id) {
      setErr("Dossier médical introuvable.");
      return;
    }

    try {
      setSaving(true);
      setErr("");
      setSuccess("");

      const collaborateurPayload = {
        cin: form.cin,
        date_naissance: form.date_naissance || null,
        telephone: form.telephone,
        adresse: form.adresse,
        poste: form.poste,
        departement: form.departement,
      };

      const dossierPayload = {
        entreprise: form.entreprise,
        localite: form.localite,
        date_recrutement: form.date_recrutement || null,
        niveau_etudes_diplomes: form.niveau_etudes_diplomes,
        profession: form.profession,
        poste_travail_actuel: form.poste_travail_actuel,
        antecedents_medicaux: form.antecedents_medicaux,
        antecedents_chirurgicaux: form.antecedents_chirurgicaux,
        antecedents_gynecologiques: form.antecedents_gynecologiques,
        antecedents_heredofamiliaux: form.antecedents_heredofamiliaux,
        tabac: form.tabac,
        alcool: form.alcool,
        automedication: form.automedication,
      };

      await Promise.all([
        api.patch(`/collaborateurs/${collaborateurId}/`, collaborateurPayload),
        api.patch(`/medical/dossier/${collaborateurId}/`, dossierPayload),
      ]);

      const examenPayload = {
        dossier: dossier.id,
        medecin_nom: form.medecin_nom,
        date_examen: form.date_examen || null,
        poids: form.poids === "" ? null : Number(form.poids),
        taille: form.taille === "" ? null : Number(form.taille),
        tension_arterielle: form.tension_arterielle,
        pouls: form.pouls,
        vision_od_pres: form.vision_od_pres,
        vision_od_loin: form.vision_od_loin,
        vision_og_pres: form.vision_og_pres,
        vision_og_loin: form.vision_og_loin,
        audition_od: form.audition_od,
        audition_og: form.audition_og,
        denture: form.denture,
        teguments: form.teguments,
        appareil_locomoteur: form.appareil_locomoteur,
        appareil_respiratoire: form.appareil_respiratoire,
        appareil_cardio_vasculaire: form.appareil_cardio_vasculaire,
        abdomen: form.abdomen,
        appareil_genito_urinaire: form.appareil_genito_urinaire,
        glandes_endocrines: form.glandes_endocrines,
        systeme_nerveux: form.systeme_nerveux,
        examens_complementaires: form.examens_complementaires,
        resultat_examen: form.resultat_examen,
        aptitude: form.aptitude || null,
        precision_aptitude: form.precision_aptitude,
        conclusion: form.conclusion,
      };

      if (examenInitialId) {
        await api.patch(`/medical/examens-initial/${examenInitialId}/`, examenPayload);
      } else {
        await api.post(`/medical/examens-initial/`, examenPayload);
      }

      const vaccinationRequests = vaccinations
        .filter((v) => v.vaccin.trim() !== "")
        .map((v) => {
          const payload = {
            dossier: dossier.id,
            vaccin: v.vaccin,
            date_1: v.date_1 || null,
            date_2: v.date_2 || null,
            date_3: v.date_3 || null,
            date_rappel: v.date_rappel || null,
          };
          if (v.id) {
            return api.patch(`/medical/vaccinations/${v.id}/`, payload);
          }
          return api.post(`/medical/vaccinations/`, payload);
        });

      const posteRequests = postes
        .filter((p) => p.description.trim() !== "")
        .map((p) => {
          const payload = {
            dossier: dossier.id,
            date_debut: p.date_debut || null,
            date_fin: p.date_fin || null,
            description: p.description,
            risque_professionnel: p.risque_professionnel,
          };
          if (p.id) {
            return api.patch(`/medical/postes-travail/${p.id}/`, payload);
          }
          return api.post(`/medical/postes-travail/`, payload);
        });

      const examenUlterieurRequests = examensUlterieurs
        .filter((ex) => ex.medecin_nom.trim() !== "" || ex.date !== "")
        .map((ex) => {
          const payload = {
            dossier: dossier.id,
            type_examen: ex.type_examen,
            date: ex.date || null,
            medecin_nom: ex.medecin_nom,
            poste_travail: ex.poste_travail,
            poids: ex.poids === "" ? null : Number(ex.poids),
            taille: ex.taille === "" ? null : Number(ex.taille),
            conclusion: ex.conclusion,
          };
          if (ex.id) {
            return api.patch(`/medical/examens-ulterieurs/${ex.id}/`, payload);
          }
          return api.post(`/medical/examens-ulterieurs/`, payload);
        });

      await Promise.all([
        ...vaccinationRequests,
        ...posteRequests,
        ...examenUlterieurRequests,
      ]);

      setSuccess("Dossier médical complet enregistré avec succès.");

      setTimeout(() => {
        navigate(`/medecin-travail/collaborateurs/${collaborateurId}`);
      }, 1000);
    } catch (e) {
      console.error(e);
      setErr(
        e?.response?.data?.detail ||
          "Erreur lors de l’enregistrement du dossier médical complet."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-slate-500">
          Chargement du dossier médical complet...
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {!embedded && (
        <button
          type="button"
          onClick={() =>
            navigate(backPath || `/medecin-travail/collaborateurs/${collaborateurId}`)
          }
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Retour au dossier collaborateur
        </button>
      )}

      {!embedded && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-slate-500">Médecin du travail</p>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">
                Dossier médical complet
              </h1>
              <p className="text-slate-500 mt-2">
                Collaborateur :{" "}
                <span className="font-medium text-slate-700">{fullName || "-"}</span>
              </p>
            </div>

            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-slate-700" />
            </div>
          </div>
        </div>
      )}

      {isReadOnly && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Lecture seule : dossier rempli par le médecin du travail.
        </div>
      )}

      {!isReadOnly && (

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAutofill}
            disabled={autofillLoading}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-70"
          >
            {autofillLoading ? "Auto-remplissage..." : "Auto-remplir ce dossier"}
          </button>
          {autofillMsg && (
            <span className="text-sm text-slate-600">{autofillMsg}</span>
          )}
        </div>
      )}

      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {err}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isReadOnly} className="space-y-6">
        <Section title="Informations collaborateur">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="CIN" name="cin" value={form.cin} onChange={handleChange} />
            <Input label="Date de naissance" type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} />
            <Input label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} />
            <Input label="Adresse" name="adresse" value={form.adresse} onChange={handleChange} />
            <Input label="Poste" name="poste" value={form.poste} onChange={handleChange} />
            <Input label="Département" name="departement" value={form.departement} onChange={handleChange} />
          </div>
        </Section>

        <Section title="Informations dossier médical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Entreprise" name="entreprise" value={form.entreprise} onChange={handleChange} />
            <Input label="Localité" name="localite" value={form.localite} onChange={handleChange} />
            <Input label="Date recrutement" type="date" name="date_recrutement" value={form.date_recrutement} onChange={handleChange} />
            <Input label="Niveau études / diplômes" name="niveau_etudes_diplomes" value={form.niveau_etudes_diplomes} onChange={handleChange} />
            <Input label="Profession" name="profession" value={form.profession} onChange={handleChange} />
            <Input label="Poste travail actuel" name="poste_travail_actuel" value={form.poste_travail_actuel} onChange={handleChange} />
          </div>
        </Section>

        <Section title="Antécédents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextArea label="Antécédents médicaux" name="antecedents_medicaux" value={form.antecedents_medicaux} onChange={handleChange} />
            <TextArea label="Antécédents chirurgicaux" name="antecedents_chirurgicaux" value={form.antecedents_chirurgicaux} onChange={handleChange} />
            <TextArea label="Antécédents gynécologiques" name="antecedents_gynecologiques" value={form.antecedents_gynecologiques} onChange={handleChange} />
            <TextArea label="Antécédents hérédo-familiaux" name="antecedents_heredofamiliaux" value={form.antecedents_heredofamiliaux} onChange={handleChange} />
          </div>
        </Section>

        <Section title="Habitudes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Input label="Tabac" name="tabac" value={form.tabac} onChange={handleChange} />
            <Input label="Alcool" name="alcool" value={form.alcool} onChange={handleChange} />
            <Input label="Automédication" name="automedication" value={form.automedication} onChange={handleChange} />
          </div>
        </Section>

        <Section title="Examen initial">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Nom du médecin" name="medecin_nom" value={form.medecin_nom} onChange={handleChange} />
            <Input label="Date de l’examen" type="date" name="date_examen" value={form.date_examen} onChange={handleChange} />
            <Input label="Poids (kg)" type="number" step="0.1" name="poids" value={form.poids} onChange={handleChange} />
            <Input label="Taille" type="number" step="0.01" name="taille" value={form.taille} onChange={handleChange} />
            <Input label="Tension artérielle" name="tension_arterielle" value={form.tension_arterielle} onChange={handleChange} />
            <Input label="Pouls" name="pouls" value={form.pouls} onChange={handleChange} />
            <Input label="Vision OD près" name="vision_od_pres" value={form.vision_od_pres} onChange={handleChange} />
            <Input label="Vision OD loin" name="vision_od_loin" value={form.vision_od_loin} onChange={handleChange} />
            <Input label="Vision OG près" name="vision_og_pres" value={form.vision_og_pres} onChange={handleChange} />
            <Input label="Vision OG loin" name="vision_og_loin" value={form.vision_og_loin} onChange={handleChange} />
            <Input label="Audition OD" name="audition_od" value={form.audition_od} onChange={handleChange} />
            <Input label="Audition OG" name="audition_og" value={form.audition_og} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <TextArea label="Denture" name="denture" value={form.denture} onChange={handleChange} />
            <TextArea label="Téguments" name="teguments" value={form.teguments} onChange={handleChange} />
            <TextArea label="Appareil locomoteur" name="appareil_locomoteur" value={form.appareil_locomoteur} onChange={handleChange} />
            <TextArea label="Appareil respiratoire" name="appareil_respiratoire" value={form.appareil_respiratoire} onChange={handleChange} />
            <TextArea label="Appareil cardio-vasculaire" name="appareil_cardio_vasculaire" value={form.appareil_cardio_vasculaire} onChange={handleChange} />
            <TextArea label="Abdomen" name="abdomen" value={form.abdomen} onChange={handleChange} />
            <TextArea label="Appareil génito-urinaire" name="appareil_genito_urinaire" value={form.appareil_genito_urinaire} onChange={handleChange} />
            <TextArea label="Glandes endocrines" name="glandes_endocrines" value={form.glandes_endocrines} onChange={handleChange} />
            <TextArea label="Système nerveux" name="systeme_nerveux" value={form.systeme_nerveux} onChange={handleChange} />
            <TextArea label="Examens complémentaires" name="examens_complementaires" value={form.examens_complementaires} onChange={handleChange} />
            <TextArea label="Résultat examen" name="resultat_examen" value={form.resultat_examen} onChange={handleChange} />
            <TextArea label="Précision aptitude" name="precision_aptitude" value={form.precision_aptitude} onChange={handleChange} />
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select label="Aptitude" name="aptitude" value={form.aptitude} onChange={handleChange}>
              <option value="">Sélectionner</option>
              <option value="APTE">Apte</option>
              <option value="APTE_AVEC_CONDITION">Apte avec condition</option>
              <option value="INAPTE_POSTE">Inapte au poste</option>
              <option value="INAPTE_DEFINITIF">Inapte définitif</option>
            </Select>

            <TextArea label="Conclusion" name="conclusion" value={form.conclusion} onChange={handleChange} rows={5} />
          </div>
        </Section>

        <Section title="Vaccinations">
          <div className="space-y-5">
            {vaccinations.map((v, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">
                    Vaccination {index + 1}
                  </h3>
                  {!isReadOnly && vaccinations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVaccination(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                  <Input
                    label="Vaccin"
                    value={v.vaccin}
                    onChange={(e) =>
                      handleArrayChange(setVaccinations, index, "vaccin", e.target.value)
                    }
                  />
                  <Input
                    label="Date 1"
                    type="date"
                    value={v.date_1}
                    onChange={(e) =>
                      handleArrayChange(setVaccinations, index, "date_1", e.target.value)
                    }
                  />
                  <Input
                    label="Date 2"
                    type="date"
                    value={v.date_2}
                    onChange={(e) =>
                      handleArrayChange(setVaccinations, index, "date_2", e.target.value)
                    }
                  />
                  <Input
                    label="Date 3"
                    type="date"
                    value={v.date_3}
                    onChange={(e) =>
                      handleArrayChange(setVaccinations, index, "date_3", e.target.value)
                    }
                  />
                  <Input
                    label="Rappel"
                    type="date"
                    value={v.date_rappel}
                    onChange={(e) =>
                      handleArrayChange(setVaccinations, index, "date_rappel", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}

            {!isReadOnly && (
              <button
                type="button"
                onClick={addVaccination}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <Plus size={16} />
                Ajouter vaccination
              </button>
            )}
          </div>
        </Section>

        <Section title="Poste de travail">
          <div className="space-y-5">
            {postes.map((p, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">
                    Poste {index + 1}
                  </h3>
                  {!isReadOnly && postes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePoste(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date début"
                    type="date"
                    value={p.date_debut}
                    onChange={(e) =>
                      handleArrayChange(setPostes, index, "date_debut", e.target.value)
                    }
                  />
                  <Input
                    label="Date fin"
                    type="date"
                    value={p.date_fin}
                    onChange={(e) =>
                      handleArrayChange(setPostes, index, "date_fin", e.target.value)
                    }
                  />
                  <Input
                    label="Description"
                    value={p.description}
                    onChange={(e) =>
                      handleArrayChange(setPostes, index, "description", e.target.value)
                    }
                  />
                  <TextArea
                    label="Risque professionnel"
                    value={p.risque_professionnel}
                    onChange={(e) =>
                      handleArrayChange(setPostes, index, "risque_professionnel", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}

            {!isReadOnly && (
              <button
                type="button"
                onClick={addPoste}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <Plus size={16} />
                Ajouter poste
              </button>
            )}
          </div>
        </Section>

        <Section title="Examens ultérieurs">
          <div className="space-y-5">
            {examensUlterieurs.map((ex, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">
                    Examen ultérieur {index + 1}
                  </h3>
                  {!isReadOnly && examensUlterieurs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExamenUlterieur(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Type examen"
                    value={ex.type_examen}
                    onChange={(e) =>
                      handleArrayChange(setExamensUlterieurs, index, "type_examen", e.target.value)
                    }
                  >
                    <option value="PERIODIQUE">Périodique</option>
                    <option value="REPRISE">Reprise de travail</option>
                    <option value="SPONTANE">Spontané</option>
                  </Select>

                  <Input
                    label="Date"
                    type="date"
                    value={ex.date}
                    onChange={(e) =>
                      handleArrayChange(setExamensUlterieurs, index, "date", e.target.value)
                    }
                  />

                  <Input
                    label="Nom médecin"
                    value={ex.medecin_nom}
                    onChange={(e) =>
                      handleArrayChange(setExamensUlterieurs, index, "medecin_nom", e.target.value)
                    }
                  />

                  <Input
                    label="Poste travail"
                    value={ex.poste_travail}
                    onChange={(e) =>
                      handleArrayChange(setExamensUlterieurs, index, "poste_travail", e.target.value)
                    }
                  />

                  <Input
                    label="Poids"
                    type="number"
                    step="0.1"
                    value={ex.poids}
                    onChange={(e) =>
                      handleArrayChange(setExamensUlterieurs, index, "poids", e.target.value)
                    }
                  />

                  <Input
                    label="Taille"
                    type="number"
                    step="0.01"
                    value={ex.taille}
                    onChange={(e) =>
                      handleArrayChange(setExamensUlterieurs, index, "taille", e.target.value)
                    }
                  />

                  <div className="md:col-span-2">
                    <TextArea
                      label="Conclusion"
                      value={ex.conclusion}
                      onChange={(e) =>
                        handleArrayChange(setExamensUlterieurs, index, "conclusion", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            {!isReadOnly && (
              <button
                type="button"
                onClick={addExamenUlterieur}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <Plus size={16} />
                Ajouter examen ultérieur
              </button>
            )}
          </div>
        </Section>

        </fieldset>

        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Enregistrement..." : "Enregistrer le dossier complet"}
            </button>

            <button
              type="button"
              onClick={() => navigate(backPath || `/medecin-travail/collaborateurs/${collaborateurId}`)}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium hover:bg-slate-50 transition"
            >
              Annuler
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
