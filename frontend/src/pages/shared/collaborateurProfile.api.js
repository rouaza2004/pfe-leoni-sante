import { api } from "../../api/api";

export const getCollaborateurProfilByMatricule = async (matricule) => {
  const res = await api.get(`/collaborateurs/matricule/${matricule}/`);
  return res.data;
};