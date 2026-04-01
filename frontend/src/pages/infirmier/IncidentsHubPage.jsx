import { useSearchParams } from "react-router-dom";
import IncidentsAvecBonPage from "./IncidentsAvecBonPage";
import IncidentsSansBonPage from "./IncidentsSansBonPage";

export default function IncidentsHubPage() {
  const [params] = useSearchParams();
  const type = params.get("type");

  if (type === "without_bon") {
    return <IncidentsSansBonPage />;
  }

  return <IncidentsAvecBonPage />;
}

