import { api } from "../api/api";

export function saveControleMedicalHistory(payload) {
  return api.post("/medical/medecin-controleur/controles-medicaux/", payload);
}

export function saveDemandeExpertiseHistory(payload) {
  return api.post("/medical/medecin-controleur/demandes-expertise/", payload);
}

export async function getMedecinControleurHistory() {
  const [controlesResponse, expertisesResponse] = await Promise.all([
    api.get("/medical/medecin-controleur/controles-medicaux/"),
    api.get("/medical/medecin-controleur/demandes-expertise/"),
  ]);

  return {
    controles: controlesResponse.data,
    expertises: expertisesResponse.data,
  };
}
