import { useState } from "react";
import { getCollaborateurProfilByMatricule } from "./collaborateurProfile.api";

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function SimpleList({ items, renderItem }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500">Aucune donnée.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="border rounded-xl p-3 text-sm">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

export default function CollaborateurProfilePage() {
  const [matricule, setMatricule] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!matricule.trim()) return;

    try {
      setLoading(true);
      setErr("");
      const result = await getCollaborateurProfilByMatricule(matricule.trim());
      setData(result);
    } catch (error) {
      console.error(error);
      setErr("Collaborateur introuvable.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil Collaborateur</h1>
        <p className="text-gray-500 text-sm">
          Recherche complète par matricule
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={matricule}
          onChange={(e) => setMatricule(e.target.value)}
          placeholder="Entrer le matricule"
          className="w-80 rounded-xl border px-4 py-3"
        />
        <button
          type="submit"
          className="rounded-xl bg-black text-white px-5 py-3"
        >
          Rechercher
        </button>
      </form>

      {loading && <p>Chargement...</p>}
      {err && <p className="text-red-600">{err}</p>}

      {data && (
        <>
          <Section title="Informations générales">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><strong>Matricule:</strong> {data.collaborateur?.matricule}</p>
              <p><strong>Nom:</strong> {data.collaborateur?.nom}</p>
              <p><strong>Prénom:</strong> {data.collaborateur?.prenom}</p>
              <p><strong>CIN:</strong> {data.collaborateur?.cin || "-"}</p>
              <p><strong>Téléphone:</strong> {data.collaborateur?.telephone || "-"}</p>
              <p><strong>Poste:</strong> {data.collaborateur?.poste || "-"}</p>
              <p><strong>Département:</strong> {data.collaborateur?.departement || "-"}</p>
              <p><strong>Site:</strong> {data.collaborateur?.site?.nom || "-"}</p>
            </div>
          </Section>

          <Section title="Dossier médical">
            {data.dossier_medical ? (
              <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                <p><strong>Entreprise:</strong> {data.dossier_medical.entreprise || "-"}</p>
                <p><strong>Localité:</strong> {data.dossier_medical.localite || "-"}</p>
                <p><strong>Date recrutement:</strong> {data.dossier_medical.date_recrutement || "-"}</p>
                <p><strong>Profession:</strong> {data.dossier_medical.profession || "-"}</p>
                <p><strong>Poste actuel:</strong> {data.dossier_medical.poste_travail_actuel || "-"}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun dossier médical.</p>
            )}
          </Section>

          <Section title={`Accidents (${data.accidents.length})`}>
            <SimpleList
              items={data.accidents}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date_accident}</p>
                  <p><strong>Zone:</strong> {item.zone}</p>
                  <p><strong>Lésion:</strong> {item.nature_lesion}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Maladies professionnelles (${data.maladies_professionnelles.length})`}>
            <SimpleList
              items={data.maladies_professionnelles}
              renderItem={(item) => (
                <>
                  <p><strong>Maladie:</strong> {item.nom_maladie}</p>
                  <p><strong>Date découverte:</strong> {item.date_decouverte}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Incidents infirmiers (${data.incidents_infirmiers.length})`}>
            <SimpleList
              items={data.incidents_infirmiers}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date_incident}</p>
                  <p><strong>Heure:</strong> {item.heure_incident}</p>
                  <p><strong>Agent causal:</strong> {item.agent_causal}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Vaccinations (${data.vaccinations.length})`}>
            <SimpleList
              items={data.vaccinations}
              renderItem={(item) => (
                <>
                  <p><strong>Vaccin:</strong> {item.vaccin}</p>
                  <p><strong>Rappel:</strong> {item.date_rappel || "-"}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Ordonnances (${data.ordonnances.length})`}>
            <SimpleList
              items={data.ordonnances}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date}</p>
                  <p><strong>Contenu:</strong> {item.contenu}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Certificats (${data.certificats.length})`}>
            <SimpleList
              items={data.certificats}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date}</p>
                  <p><strong>Repos:</strong> {item.nb_jours_repos} jours</p>
                </>
              )}
            />
          </Section>

          <Section title={`Fiches aptitude (${data.fiches_aptitude.length})`}>
            <SimpleList
              items={data.fiches_aptitude}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date}</p>
                  <p><strong>Type examen:</strong> {item.type_examen}</p>
                  <p><strong>Aptitude:</strong> {item.aptitude}</p>
                </>
              )}
            />
          </Section>
        </>
      )}
    </div>
  );
}