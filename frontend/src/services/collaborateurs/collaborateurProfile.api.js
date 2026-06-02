import { api } from "@/api/api";
import { fixFrenchTextDeep } from "@/utils/fixFrenchText";

export const getCollaborateurProfilByMatricule = async (matricule) => {
  const res = await api.get(`/collaborateurs/matricule/${matricule}/`);
  return fixFrenchTextDeep(res.data);
};


