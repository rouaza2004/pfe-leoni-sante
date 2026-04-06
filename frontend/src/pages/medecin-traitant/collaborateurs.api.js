import { api } from "@/api/api";
import { fixFrenchTextDeep } from "@/utils/fixFrenchText";

export const getCollaborateurs = async (search = "") => {
  const res = await api.get("/collaborateurs/", {
    params: search ? { search } : {},
  });
  return fixFrenchTextDeep(res.data);
};
