import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { api } from "@/api/api";

const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-200"
    />
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <textarea
      {...props}
      rows={4}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-200"
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <select
      {...props}
      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-200 bg-white"
    >
      {children}
    </select>
  </div>
);

export default function FicheAptitudeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const collaborateurId = Number(id);

  const [collab, setCollab] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    entreprise: "",
    adresse_entreprise: "",
    nature_activite: "",
    numero_cnss: "",
    nom_prenom: "",
    date_lieu_naissance: "",
    adresse_travailleur: "",
    cnss_travailleur: "",
    qualifications_professionnelles: "",
    date_recrutement: "",
    poste_travail: "",
    medecin_travail: "",
    date_examen: "",
    conclusion: "",
    type_examen: "EMBAUCHE",
    aptitude: "APTE",
    recommandations: "",
  });

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

        const c = collabRes.data || {};
        const d = dossierRes.data || {};

        setCollab(c);
        setForm((prev) => ({
          ...prev,
          entreprise: d.entreprise || "",
          adresse_entreprise: d.adresse_entreprise || "",
          nature_activite: d.nature_activite || "",
          numero_cnss: d.numero_cnss || "",
          nom_prenom: `${c.nom || ""} ${c.prenom || ""}`.trim(),
          date_lieu_naissance: c.date_naissance || "",
          adresse_travailleur: c.adresse || "",
          cnss_travailleur: c.cnss || "",
          qualifications_professionnelles: c.poste || "",
          date_recrutement: d.date_recrutement || "",
          poste_travail: c.poste || "",
          medecin_travail: "",
          date_examen: "",
          conclusion: "",
        }));
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr("Impossible de charger les données.");
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setErr("");
      setSuccess("");

      const requiredFields = [
        { key: "entreprise", label: "Entreprise" },
        { key: "nom_prenom", label: "Nom et prénom" },
        { key: "type_examen", label: "Type d’examen" },
        { key: "aptitude", label: "Aptitude" },
        { key: "date_examen", label: "Date de l’examen" },
      ];

      const missing = requiredFields
        .filter((f) => !String(form[f.key] || "").trim())
        .map((f) => f.label);

      if (missing.length > 0) {
        setErr(`Champs obligatoires : ${missing.join(", ")}.`);
        setSaving(false);
        return;
      }

      const payload = {
        entreprise: form.entreprise,
        adresse_entreprise: form.adresse_entreprise,
        nature_activite: form.nature_activite,
        numero_cnss: form.numero_cnss,
        nom_prenom: form.nom_prenom,
        date_lieu_naissance: form.date_lieu_naissance,
        adresse_travailleur: form.adresse_travailleur,
        cnss_travailleur: form.cnss_travailleur,
        qualifications_professionnelles: form.qualifications_professionnelles,
        date_recrutement: form.date_recrutement || null,
        poste_travail: form.poste_travail,
        medecin_travail: form.medecin_travail,
        date_examen: form.date_examen || null,
        conclusion: form.conclusion,
        type_examen: form.type_examen,
        aptitude: form.aptitude,
        recommandations: form.recommandations,
      };

      const res = await api.post(
        `/medical/fiche-aptitude/${collaborateurId}/`,
        payload
      );

      console.log("FICHE APTITUDE CREATED =", res.data);

      setSuccess("Fiche d’aptitude créée avec succès.");

      navigate(`/medecin-travail/collaborateurs/${collaborateurId}`);
    } catch (e) {
      console.error(e);
      console.log("BACKEND ERROR =", e?.response?.data);

      setErr(
        e?.response?.data?.detail ||
          JSON.stringify(e?.response?.data) ||
          "Erreur lors de la création de la fiche d’aptitude."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-slate-500">
          Chargement du formulaire...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <button
        type="button"
        onClick={() =>
          navigate(`/medecin-travail/collaborateurs/${collaborateurId}`)
        }
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Retour au dossier collaborateur
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-slate-500">Médecin du travail</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Nouvelle fiche d’aptitude
            </h1>
            <p className="text-slate-500 mt-2">
              Collaborateur :{" "}
              <span className="font-medium text-slate-700">
                {fullName || "-"}
              </span>
            </p>
          </div>

          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-slate-700" />
          </div>
        </div>
      </div>

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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">
            Entreprise
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Entreprise"
              name="entreprise"
              value={form.entreprise}
              onChange={handleChange}
            />
            <Input
              label="Adresse entreprise"
              name="adresse_entreprise"
              value={form.adresse_entreprise}
              onChange={handleChange}
            />
            <Input
              label="Nature d’activité"
              name="nature_activite"
              value={form.nature_activite}
              onChange={handleChange}
            />
            <Input
              label="N° CNSS entreprise"
              name="numero_cnss"
              value={form.numero_cnss}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">
            Travailleur
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Nom et prénom"
              name="nom_prenom"
              value={form.nom_prenom}
              onChange={handleChange}
            />
            <Input
              label="Date et lieu de naissance"
              name="date_lieu_naissance"
              value={form.date_lieu_naissance}
              onChange={handleChange}
            />
            <Input
              label="Adresse"
              name="adresse_travailleur"
              value={form.adresse_travailleur}
              onChange={handleChange}
            />
            <Input
              label="N° CNSS travailleur"
              name="cnss_travailleur"
              value={form.cnss_travailleur}
              onChange={handleChange}
            />
            <Input
              label="Qualifications professionnelles"
              name="qualifications_professionnelles"
              value={form.qualifications_professionnelles}
              onChange={handleChange}
            />
            <Input
              label="Date de recrutement"
              type="date"
              name="date_recrutement"
              value={form.date_recrutement}
              onChange={handleChange}
            />
            <Input
              label="Poste de travail"
              name="poste_travail"
              value={form.poste_travail}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">
            Examen médical
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Select
              label="Type d’examen"
              name="type_examen"
              value={form.type_examen}
              onChange={handleChange}
            >
              <option value="EMBAUCHE">Embauche</option>
              <option value="PERIODIQUE">Périodique</option>
              <option value="REPRISE">Reprise</option>
              <option value="SPONTANE">Spontané</option>
            </Select>

            <Input
              label="Date de l’examen"
              type="date"
              name="date_examen"
              value={form.date_examen}
              onChange={handleChange}
            />

            <Input
              label="Médecin du travail"
              name="medecin_travail"
              value={form.medecin_travail}
              onChange={handleChange}
              placeholder="Nom du médecin"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">
            Conclusion
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Aptitude"
              name="aptitude"
              value={form.aptitude}
              onChange={handleChange}
            >
              <option value="APTE">Apte</option>
              <option value="APTE_AMENAGEMENT">Apte avec aménagement</option>
              <option value="INAPTE_TEMPORAIRE">Inapte temporaire</option>
              <option value="APTE_APRES_CHANGEMENT">
                Apte après changement du poste
              </option>
              <option value="INAPTE_DEFINITIF">Inapte définitif</option>
            </Select>

            <Input
              label="Conclusion / Observations"
              name="conclusion"
              value={form.conclusion}
              onChange={handleChange}
              placeholder="Conclusion médicale"
            />
          </div>

          <div className="mt-5">
            <TextArea
              label="Recommandations / précisions"
              name="recommandations"
              value={form.recommandations}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : "Créer la fiche"}
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/medecin-travail/collaborateurs/${collaborateurId}`)
            }
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium hover:bg-slate-50 transition"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
