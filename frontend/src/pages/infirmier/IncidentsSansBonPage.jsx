import IncidentBonManagementPage from "./IncidentBonManagementPage";

export default function IncidentsSansBonPage() {
  return (
    <IncidentBonManagementPage
      title="Incidents sans Bon"
      description="Enregistrement des incidents sans génération ni association avec un bon."
      listLabel="Incidents sans bon"
      endpoint="/medical/incidents-sans-bon/"
      formId="incident-sans-bon-form"
      includeBonFields={false}
    />
  );
}
