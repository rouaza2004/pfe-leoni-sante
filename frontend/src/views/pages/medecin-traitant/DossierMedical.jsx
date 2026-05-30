import DossierMedicalCompletForm from "../medecin-travail/DossierMedicalCompletForm";

export default function DossierMedical({ collaborateurId }) {
  return (
    <DossierMedicalCompletForm
      collaborateurId={collaborateurId}
      readOnly={true}
      embedded={true}
    />
  );
}

