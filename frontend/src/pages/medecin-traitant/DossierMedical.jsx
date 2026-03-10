import { useEffect, useState } from "react";
import { api } from "@/api/api";
import CrudList from "./components/CrudList";

const TabBtn = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition
      ${active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
    type="button"
  >
    {children}
  </button>
);

function Field({ label, value }) {
  return (
    <div>
      <label className="text-xs text-slate-500">{label}</label>
      <input
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50"
        value={value ?? ""}
        disabled
        readOnly
      />
    </div>
  );
}

function General({ dossier }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
      <h3 className="text-lg font-bold text-slate-900">Informations générales</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Entreprise" value={dossier.entreprise || "—"} />
        <Field label="Localité" value={dossier.localite || "—"} />
      </div>

      <div className="text-xs text-slate-500">* Lecture فقط (Médecin traitant).</div>
    </div>
  );
}

function Examens({ dossier }) {
  const ei = dossier.examen_initial;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3">
        <h3 className="text-lg font-bold text-slate-900">Examen médical initial</h3>

        {!ei ? (
          <p className="text-sm text-slate-500">Aucun examen initial.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Médecin" value={ei.medecin_nom} />
              <Field label="Date" value={ei.date_examen} />
              <Field label="Poids" value={ei.poids} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Field label="Taille" value={ei.taille} />
              <Field label="Tension" value={ei.tension_arterielle} />
              <Field label="Pouls" value={ei.pouls} />
              <Field label="Conclusion" value={ei.conclusion} />
            </div>
          </>
        )}
      </div>

      <CrudList
        title="Examens ultérieurs"
        items={dossier.examens_ulterieurs}
        readOnly={true}
        fields={[
          { name: "type_examen", label: "Type" },
          { name: "date", label: "Date" },
          { name: "medecin_nom", label: "Médecin" },
          { name: "poste_travail", label: "Poste" },
          { name: "poids", label: "Poids" },
          { name: "taille", label: "Taille" },
          { name: "conclusion", label: "Conclusion" },
        ]}
      />
    </div>
  );
}

function Vaccinations({ dossier }) {
  return (
    <CrudList
      title="Vaccinations"
      items={dossier.vaccinations}
      readOnly={true}
      fields={[
        { name: "vaccin", label: "Vaccin" },
        { name: "date_1", label: "Date 1" },
        { name: "date_2", label: "Date 2" },
        { name: "date_3", label: "Date 3" },
        { name: "date_rappel", label: "Rappel" },
      ]}
    />
  );
}

function Accidents({ dossier }) {
  return (
    <CrudList
      title="Accidents de travail"
      items={dossier.accidents}
      readOnly={true}
      fields={[
        { name: "date_accident", label: "Date" },
        { name: "cause", label: "Cause" },
        { name: "nature_lesion", label: "Nature lésion" },
        { name: "siege_lesion", label: "Siège lésion" },
        { name: "duree_arret", label: "Arrêt (jours)" },
        { name: "ipp", label: "IPP" },
      ]}
    />
  );
}

function Maladies({ dossier }) {
  return (
    <CrudList
      title="Maladies professionnelles"
      items={dossier.maladies_professionnelles}
      readOnly={true}
      fields={[
        { name: "nom_maladie", label: "Nom" },
        { name: "agent_causal", label: "Agent causal" },
        { name: "numero_tableau", label: "N° tableau" },
        { name: "date_decouverte", label: "Date découverte" },
        { name: "duree_arret", label: "Arrêt (jours)" },
        { name: "ipp", label: "IPP" },
      ]}
    />
  );
}

function Postes({ dossier }) {
  return (
    <CrudList
      title="Postes de travail"
      items={dossier.postes}
      readOnly={true}
      fields={[
        { name: "date_debut", label: "Du" },
        { name: "date_fin", label: "Au" },
        { name: "description", label: "Description" },
        { name: "risque_professionnel", label: "Risque" },
      ]}
    />
  );
}

export default function DossierMedical({ collaborateurId }) {
  const [tab, setTab] = useState("general");
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(`/medical/dossier/${collaborateurId}/`);
      setDossier(res.data);
    } catch (e) {
      console.error(e);
      setErr("Aucun dossier médical (créé par médecin du travail lors de la visite d'embauche).");
      setDossier(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collaborateurId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collaborateurId]);

  if (loading) return <div className="bg-white rounded-2xl border p-6">Chargement...</div>;
  if (err) return <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-rose-700">{err}</div>;
  if (!dossier) return <div className="bg-white rounded-2xl border p-6">Aucun dossier.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <TabBtn active={tab === "general"} onClick={() => setTab("general")}>Général</TabBtn>
        <TabBtn active={tab === "vaccins"} onClick={() => setTab("vaccins")}>Vaccinations</TabBtn>
        <TabBtn active={tab === "examens"} onClick={() => setTab("examens")}>Examens</TabBtn>
        <TabBtn active={tab === "accidents"} onClick={() => setTab("accidents")}>Accidents</TabBtn>
        <TabBtn active={tab === "maladies"} onClick={() => setTab("maladies")}>Maladies Pro</TabBtn>
        <TabBtn active={tab === "postes"} onClick={() => setTab("postes")}>Postes</TabBtn>
      </div>

      {tab === "general" && <General dossier={dossier} />}
      {tab === "vaccins" && <Vaccinations dossier={dossier} />}
      {tab === "examens" && <Examens dossier={dossier} />}
      {tab === "accidents" && <Accidents dossier={dossier} />}
      {tab === "maladies" && <Maladies dossier={dossier} />}
      {tab === "postes" && <Postes dossier={dossier} />}
    </div>
  );
}