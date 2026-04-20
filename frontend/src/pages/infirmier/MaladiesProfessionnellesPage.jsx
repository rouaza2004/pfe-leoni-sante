import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Eye, Printer, PencilLine, Loader2 } from "lucide-react";
import { api } from "@/api/api";
import { getCollaborateurProfilByMatricule } from "../shared/collaborateurProfile.api";

const emptyForm = {
  matricule: "",
  employeur_cnss: "",
  employeur_nom: "",
  employeur_adresse: "",
  employeur_code_postal: "",
  employeur_telephone: "",
  employeur_activite: "",
  victime_cnss: "",
  victime_nom: "",
  victime_prenom: "",
  victime_nom_naissance: "",
  victime_prenom_pere: "",
  victime_nationalite: "",
  victime_sexe: "",
  victime_date_naissance: "",
  victime_lieu_naissance: "",
  victime_cin: "",
  victime_adresse: "",
  victime_code_postal: "",
  victime_date_embauche: "",
  victime_specialite: "",
  victime_situation: "",
  victime_profession: "",
  victime_lieu_travail: "",
  nom_maladie: "",
  agent_causal: "",
  numero_tableau: "",
  date_decouverte: "",
  medecin_constat: "",
  date_constat: "",
  nature_travail: "",
  date_arret_exposition: "",
  arret_travail: false,
  date_arret: "",
  salaire_maintenu: false,
  salaire_duree: "",
  salaire_montant: "",
  salaire_unite: "",
  signataire_nom: "",
  signataire_qualite: "",
  signature_lieu: "",
  signature_date: "",
};

const emptyTravail = { entreprise: "", nature_travail: "", materiaux: "", date_debut: "", date_fin: "" };

const selectOptions = {
  sexe: [
    { value: "", label: "—" },
    { value: "HOMME", label: "Homme" },
    { value: "FEMME", label: "Femme" },
  ],
};

export default function MaladiesProfessionnellesPage() {
  const [maladies, setMaladies] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [travaux, setTravaux] = useState([emptyTravail]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedMaladie, setSelectedMaladie] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return maladies;

    return maladies.filter((item) =>
      [item.matricule].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [maladies, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/medical/maladies-professionnelles/");
      const data = Array.isArray(res.data) ? res.data : [];
      setMaladies(data);
    } catch (e) {
      console.error(e);
      setErr("Erreur lors du chargement des maladies professionnelles.");
    } finally {
      setLoading(false);
    }
  };

  const handleMatriculeSearch = async () => {
    if (!form.matricule.trim()) return;
    try {
      setErr("");
      const profile = await getCollaborateurProfilByMatricule(form.matricule.trim());
      setSelectedProfile(profile);
      const collab = profile?.collaborateur || {};
      const dossier = profile?.dossier_medical || {};

      setForm((prev) => ({
        ...prev,
        victime_nom: prev.victime_nom || collab.nom || "",
        victime_prenom: prev.victime_prenom || collab.prenom || "",
        victime_cin: prev.victime_cin || collab.cin || "",
        victime_date_naissance:
          prev.victime_date_naissance || collab.date_naissance || "",
        victime_adresse: prev.victime_adresse || collab.adresse || "",
        employeur_nom: prev.employeur_nom || dossier.entreprise || collab.site?.nom || "",
        employeur_adresse:
          prev.employeur_adresse || dossier.localite || collab.site?.localite || "",
      }));
    } catch (e) {
      console.error(e);
      setSelectedProfile(null);
      setErr("Matricule introuvable.");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleTravailChange = (index, field, value) => {
    setTravaux((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addTravail = () => setTravaux((prev) => [...prev, emptyTravail]);
  const removeTravail = (index) =>
    setTravaux((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setForm(emptyForm);
    setTravaux([emptyTravail]);
    setSelectedProfile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const buildPayload = (dossierId) => ({
    dossier: dossierId,
    nom_maladie: form.nom_maladie,
    agent_causal: form.agent_causal,
    numero_tableau: form.numero_tableau,
    date_decouverte: form.date_decouverte,
    employeur_cnss: form.employeur_cnss,
    employeur_nom: form.employeur_nom,
    employeur_adresse: form.employeur_adresse,
    employeur_code_postal: form.employeur_code_postal,
    employeur_telephone: form.employeur_telephone,
    employeur_activite: form.employeur_activite,
    victime_cnss: form.victime_cnss,
    victime_nom: form.victime_nom,
    victime_prenom: form.victime_prenom,
    victime_nom_naissance: form.victime_nom_naissance,
    victime_prenom_pere: form.victime_prenom_pere,
    victime_nationalite: form.victime_nationalite,
    victime_sexe: form.victime_sexe || null,
    victime_date_naissance: form.victime_date_naissance || null,
    victime_lieu_naissance: form.victime_lieu_naissance,
    victime_cin: form.victime_cin,
    victime_adresse: form.victime_adresse,
    victime_code_postal: form.victime_code_postal,
    victime_date_embauche: form.victime_date_embauche || null,
    victime_specialite: form.victime_specialite,
    victime_situation: form.victime_situation,
    victime_profession: form.victime_profession,
    victime_lieu_travail: form.victime_lieu_travail,
    medecin_constat: form.medecin_constat,
    date_constat: form.date_constat || null,
    nature_travail: form.nature_travail,
    date_arret_exposition: form.date_arret_exposition || null,
    arret_travail: form.arret_travail,
    date_arret: form.date_arret || null,
    salaire_maintenu: form.salaire_maintenu,
    salaire_duree: form.salaire_duree,
    salaire_montant: form.salaire_montant,
    salaire_unite: form.salaire_unite,
    travaux_anterieurs: travaux,
    signataire_nom: form.signataire_nom,
    signataire_qualite: form.signataire_qualite,
    signature_lieu: form.signature_lieu,
    signature_date: form.signature_date || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.matricule.trim()) {
      setErr("Veuillez saisir une matricule valide.");
      return;
    }

    try {
      setSaving(true);
      setErr("");
      const dossierRes = await api.get(
        `/medical/dossier/matricule/${form.matricule.trim()}/`
      );
      const dossierId = dossierRes.data?.id;
      if (!dossierId) {
        setErr("Dossier médical introuvable.");
        return;
      }

      const payload = buildPayload(dossierId);

      if (editingId) {
        await api.patch(`/medical/maladies-professionnelles/${editingId}/`, payload);
      } else {
        await api.post("/medical/maladies-professionnelles/", payload);
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      setErr("Erreur lors de l'enregistrement de la maladie professionnelle.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedMaladie(item);
    setForm({
      ...emptyForm,
      ...item,
      matricule: item.matricule || "",
    });
    setTravaux(item.travaux_anterieurs?.length ? item.travaux_anterieurs : [emptyTravail]);
    setShowForm(true);
  };

  const handlePrint = async (id) => {
    try {
      const res = await api.get(`/medical/maladies-professionnelles/${id}/pdf/`, {
        responseType: "blob",
      });
      const file = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(file);
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
      setErr("Impossible d'ouvrir le PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Module Infirmier</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Déclaration de maladie professionnelle
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Saisie, consultation, modification et impression du formulaire officiel.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            {showForm ? "Fermer le formulaire" : "Nouvelle déclaration"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {showForm && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Modifier la déclaration" : "Nouvelle déclaration"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler la modification
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Section title="Recherche par matricule">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Matricule collaborateur"
                  name="matricule"
                  value={form.matricule}
                  onChange={handleChange}
                  placeholder="Entrer la matricule"
                  required
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleMatriculeSearch}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Search size={16} />
                    Rechercher
                  </button>
                </div>
              </div>
              {selectedProfile?.collaborateur && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="font-medium text-slate-900">
                    {selectedProfile.collaborateur.prenom}{" "}
                    {selectedProfile.collaborateur.nom}
                  </p>
                </div>
              )}
            </Section>

            <Section title="Employeur">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="CNSS employeur" name="employeur_cnss" value={form.employeur_cnss} onChange={handleChange} />
                <InputField label="Nom employeur" name="employeur_nom" value={form.employeur_nom} onChange={handleChange} />
                <InputField label="Adresse" name="employeur_adresse" value={form.employeur_adresse} onChange={handleChange} />
                <InputField label="Code postal" name="employeur_code_postal" value={form.employeur_code_postal} onChange={handleChange} />
                <InputField label="Téléphone" name="employeur_telephone" value={form.employeur_telephone} onChange={handleChange} />
                <InputField label="Nature d'activité" name="employeur_activite" value={form.employeur_activite} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Victime">
              <div className="grid gap-4 md:grid-cols-3">
                <InputField label="CNSS victime" name="victime_cnss" value={form.victime_cnss} onChange={handleChange} />
                <InputField label="Nom" name="victime_nom" value={form.victime_nom} onChange={handleChange} />
                <InputField label="Prénom" name="victime_prenom" value={form.victime_prenom} onChange={handleChange} />
                <InputField label="Nom de naissance" name="victime_nom_naissance" value={form.victime_nom_naissance} onChange={handleChange} />
                <InputField label="Nom du père" name="victime_prenom_pere" value={form.victime_prenom_pere} onChange={handleChange} />
                <InputField label="Nationalité" name="victime_nationalite" value={form.victime_nationalite} onChange={handleChange} />
                <SelectField label="Sexe" name="victime_sexe" value={form.victime_sexe} onChange={handleChange} options={selectOptions.sexe} />
                <InputField label="Date naissance" name="victime_date_naissance" type="date" value={form.victime_date_naissance} onChange={handleChange} />
                <InputField label="Lieu naissance" name="victime_lieu_naissance" value={form.victime_lieu_naissance} onChange={handleChange} />
                <InputField label="CIN" name="victime_cin" value={form.victime_cin} onChange={handleChange} />
                <InputField label="Adresse" name="victime_adresse" value={form.victime_adresse} onChange={handleChange} />
                <InputField label="Code postal" name="victime_code_postal" value={form.victime_code_postal} onChange={handleChange} />
                <InputField label="Date embauche" name="victime_date_embauche" type="date" value={form.victime_date_embauche} onChange={handleChange} />
                <InputField label="Spécialité" name="victime_specialite" value={form.victime_specialite} onChange={handleChange} />
                <InputField label="Situation" name="victime_situation" value={form.victime_situation} onChange={handleChange} />
                <InputField label="Profession" name="victime_profession" value={form.victime_profession} onChange={handleChange} />
                <InputField label="Lieu travail habituel" name="victime_lieu_travail" value={form.victime_lieu_travail} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Maladie professionnelle">
              <div className="grid gap-4 md:grid-cols-3">
                <InputField label="Maladie" name="nom_maladie" value={form.nom_maladie} onChange={handleChange} required />
                <InputField label="Agent causal" name="agent_causal" value={form.agent_causal} onChange={handleChange} />
                <InputField label="Tableau" name="numero_tableau" value={form.numero_tableau} onChange={handleChange} />
                <InputField label="Date découverte" name="date_decouverte" type="date" value={form.date_decouverte} onChange={handleChange} required />
                <InputField label="Médecin constat" name="medecin_constat" value={form.medecin_constat} onChange={handleChange} />
                <InputField label="Date constat" name="date_constat" type="date" value={form.date_constat} onChange={handleChange} />
                <InputField label="Date arrêt exposition" name="date_arret_exposition" type="date" value={form.date_arret_exposition} onChange={handleChange} />
                <CheckboxField label="Arrêt de travail" name="arret_travail" checked={form.arret_travail} onChange={handleChange} />
                <InputField label="Date arrêt" name="date_arret" type="date" value={form.date_arret} onChange={handleChange} />
              </div>
              <div className="mt-4">
                <TextareaField label="Nature du travail" name="nature_travail" value={form.nature_travail} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Salaire / arrêt">
              <div className="grid gap-4 md:grid-cols-3">
                <CheckboxField label="Salaire maintenu" name="salaire_maintenu" checked={form.salaire_maintenu} onChange={handleChange} />
                <InputField label="Durée" name="salaire_duree" value={form.salaire_duree} onChange={handleChange} />
                <InputField label="Montant" name="salaire_montant" value={form.salaire_montant} onChange={handleChange} />
                <InputField label="Unité (jour/mois...)" name="salaire_unite" value={form.salaire_unite} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Travaux antérieurs exposants">
              <div className="space-y-4">
                {travaux.map((row, index) => (
                  <div key={`travail-${index}`} className="grid gap-3 md:grid-cols-5">
                    <InputField label="Entreprise" value={row.entreprise} onChange={(e) => handleTravailChange(index, "entreprise", e.target.value)} />
                    <InputField label="Nature du travail" value={row.nature_travail} onChange={(e) => handleTravailChange(index, "nature_travail", e.target.value)} />
                    <InputField label="Matériaux nocifs" value={row.materiaux} onChange={(e) => handleTravailChange(index, "materiaux", e.target.value)} />
                    <InputField label="Du" type="date" value={row.date_debut} onChange={(e) => handleTravailChange(index, "date_debut", e.target.value)} />
                    <InputField label="Au" type="date" value={row.date_fin} onChange={(e) => handleTravailChange(index, "date_fin", e.target.value)} />
                    {travaux.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTravail(index)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Supprimer la ligne
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTravail}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ajouter une ligne
                </button>
              </div>
            </Section>

            <Section title="Signature">
              <div className="grid gap-4 md:grid-cols-3">
                <InputField label="Nom signataire" name="signataire_nom" value={form.signataire_nom} onChange={handleChange} />
                <InputField label="Qualité" name="signataire_qualite" value={form.signataire_qualite} onChange={handleChange} />
                <InputField label="Lieu" name="signature_lieu" value={form.signature_lieu} onChange={handleChange} />
                <InputField label="Date" name="signature_date" type="date" value={form.signature_date} onChange={handleChange} />
              </div>
            </Section>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingId ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste des déclarations</h2>
            <p className="text-sm text-slate-500">
              Recherche, consultation, modification et impression.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher par matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Maladie</th>
                  <th className="px-3 py-3 font-medium">Matricule</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 text-slate-700">{item.date_decouverte}</td>
                      <td className="px-3 py-3 text-slate-700">{item.nom_maladie}</td>
                      <td className="px-3 py-3 text-slate-700">{item.matricule}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedMaladie(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={14} />
                            Voir
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <PencilLine size={14} />
                            Modifier
                          </button>
                          <button
                            onClick={() => handlePrint(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            <Printer size={14} />
                            Imprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-3 py-10 text-center text-slate-500">
                      Aucune déclaration trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedMaladie && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Détail de la déclaration</h2>
              <p className="text-sm text-slate-500">Matricule {selectedMaladie.matricule}</p>
            </div>
            <button
              onClick={() => setSelectedMaladie(null)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Info label="Maladie" value={selectedMaladie.nom_maladie} />
            <Info label="Agent causal" value={selectedMaladie.agent_causal || "-"} />
            <Info label="Tableau" value={selectedMaladie.numero_tableau || "-"} />
            <Info label="Date découverte" value={selectedMaladie.date_decouverte} />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => handleEdit(selectedMaladie)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <PencilLine size={16} />
              Modifier
            </button>
            <button
              onClick={() => handlePrint(selectedMaladie.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Printer size={16} />
              Imprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", required, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
      />
    </div>
  );
}

function TextareaField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}
