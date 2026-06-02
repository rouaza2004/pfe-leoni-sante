import IncidentBonManagementPage from "./IncidentBonManagementPage";

export default function IncidentsAvecBonPage() {
  return (
    <IncidentBonManagementPage
      title="Incidents + Bon"
      description="Enregistrement et suivi des incidents associés aux informations du bon."
      listLabel="Incidents avec bon"
      endpoint="/medical/incidents-avec-bon/"
      formId="incident-avec-bon-form"
      includeBonFields
    />
  );
}

