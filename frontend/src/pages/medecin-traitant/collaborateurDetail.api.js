import { api } from "@/api/api";

export const getCollaborateurs = async () => {
  const res = await api.get("/collaborateurs/");
  return res.data;
};

export const getDossierMedical = async (collaborateurId) => {
  const res = await api.get(`/medical/dossier/${collaborateurId}/`);
  return res.data;
};